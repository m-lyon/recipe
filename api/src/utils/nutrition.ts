import { Types } from 'mongoose';

import { Size } from '../models/Size.js';
import { Unit } from '../models/Unit.js';
import { Ingredient } from '../models/Ingredient.js';
import { IngredientMeasure } from '../models/IngredientMeasure.js';
import { MacroNutrients, NutritionalInfo } from '../models/NutritionalInfo.js';
import { Recipe, RecipeIngredientType, RecipeYield } from '../models/Recipe.js';

/**
 * A recipe's nutrition, calculated from its ingredients.
 *
 * Every quantity reaches grams, or a share of a child recipe, before it meets a macro:
 *  - an ingredient: grams(quantity, unit, measures) × perGram
 *  - a recipe used as an ingredient: (quantity ÷ the child's yield in the same dimension) ×
 *    the child's total
 * Nutrition data is not stored, so a recipe does not need re-saving when ingredients change.
 */

/** Recipes nested deeper than this are not followed. */
export const MAX_DEPTH = 10;

export const NutritionStatuses = ['COUNTED', 'PARTIAL', 'UNCOUNTED'] as const;
export type NutritionStatus = (typeof NutritionStatuses)[number];
export const UncountedCodes = [
    'NO_QUANTITY',
    'NO_NUTRITION',
    'NO_MEASURE',
    'NO_YIELD',
    'CHILD_PARTIAL',
    'CYCLE',
    'DEPTH_LIMIT',
] as const;
export type UncountedCode = (typeof UncountedCodes)[number];

export interface IngredientNutrition {
    recipeIngredient: Types.ObjectId;
    status: NutritionStatus;
    /** What this ingredient contributed: zero when UNCOUNTED. */
    macros: MacroNutrients;
    /** Set when the status is not COUNTED. */
    reason: { code: UncountedCode; message: string } | null;
    /** PARTIAL only: the ingredients of the child recipe that were not fully counted. */
    childUncounted: number | null;
    /** A recipe used as an ingredient: its id, so a client can link to its breakdown. */
    childRecipe: string | null;
}

export interface RecipeNutrition {
    /** The whole recipe, as authored. */
    total: MacroNutrients;
    ingredients: IngredientNutrition[];
}

export const ZERO_MACROS: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function addMacros(a: MacroNutrients, b: MacroNutrients): MacroNutrients {
    return {
        calories: a.calories + b.calories,
        protein: a.protein + b.protein,
        carbs: a.carbs + b.carbs,
        fat: a.fat + b.fat,
    };
}

function isZero(macros: MacroNutrients): boolean {
    return !macros.calories && !macros.protein && !macros.carbs && !macros.fat;
}

export function scaleMacros(macros: MacroNutrients, factor: number): MacroNutrients {
    return {
        calories: macros.calories * factor,
        protein: macros.protein * factor,
        carbs: macros.carbs * factor,
        fat: macros.fat * factor,
    };
}

function parseNumber(text: string): number {
    const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    const fraction = /^(\d+)\/(\d+)$/.exec(text);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    return /^\d*\.?\d+$/.test(text) ? Number(text) : NaN;
}

/** A quantity as a number: "1/2" is 0.5, and a range such as "10-12" is its midpoint. */
export function quantityToFloat(quantity: string): number {
    const parts = quantity.split('-').map((part) => part.trim());
    if (parts.length === 2) {
        const [low, high] = parts.map(parseNumber);
        return (low + high) / 2;
    }
    return parts.length === 1 ? parseNumber(parts[0]) : NaN;
}

export type UnitData = Pick<Unit, 'longSingular' | 'hidden' | 'dimension' | 'perCanonical'> & {
    _id: Types.ObjectId | string;
};

export interface MeasureData {
    unit: UnitData;
    size: string | null;
    prepMethod: string | null;
    grams: number;
}

export interface MeasureKey {
    unit: UnitData;
    sizeId: string | null;
    prepMethodId: string | null;
}

function specificity(measure: MeasureData): number {
    return (measure.size ? 1 : 0) + (measure.prepMethod ? 1 : 0);
}

/**
 * Grams in one of the measure key's unit, from the most specific measure that matches:
 *  1. exact (unit, size, prep)
 *  2. drop prep (unit, size)
 *  3. drop size (unit, prep)
 *  4. drop both (unit)
 *  5. volume only: the least specific volume row, rescaled by perCanonical
 */
export function gramsPerUnit(measures: MeasureData[], key: MeasureKey): number | null {
    const forUnit = measures.filter((m) => String(m.unit._id) === String(key.unit._id));
    const match =
        forUnit.find((m) => m.size === key.sizeId && m.prepMethod === key.prepMethodId) ??
        forUnit.find((m) => m.size === key.sizeId && m.prepMethod === null) ??
        forUnit.find((m) => m.size === null && m.prepMethod === key.prepMethodId) ??
        forUnit.find((m) => m.size === null && m.prepMethod === null);
    if (match) return match.grams;
    if (key.unit.dimension !== 'volume') return null;
    const volume = measures
        .filter((m) => m.unit.dimension === 'volume')
        .sort((a, b) => specificity(a) - specificity(b))[0];
    if (!volume) return null;
    return (volume.grams / volume.unit.perCanonical) * key.unit.perCanonical;
}

export function describeOneUnit(unit: UnitData, name: string, sizeName?: string | null): string {
    const unitStr = unit.hidden ? '' : `${unit.longSingular} of `;
    return `1 ${unitStr}${sizeName ? `${sizeName} ` : ''}${name}`;
}

export interface YieldRow {
    quantity: number;
    unit: UnitData;
}

/**
 * The share of a child recipe that a quantity uses, or null when the child's yield has
 * no row to measure the quantity against.
 *
 * A mass or volume quantity uses the yield row in its dimension, in canonical units, so grams
 * read against kilograms and tablespoons against cups. A count quantity needs a row in its
 * exact unit: "1 slice" cannot be read against "2 each".
 */
export function yieldFraction(quantity: number, unit: UnitData, yields: YieldRow[]): number | null {
    const canonical = (row: { quantity: number; unit: UnitData }) =>
        row.quantity * row.unit.perCanonical;
    const amount = { quantity, unit };
    if (unit.dimension === 'count') {
        const row = yields.find((y) => String(y.unit._id) === String(unit._id));
        return row ? quantity / row.quantity : null;
    }
    // No density bridge is needed: a yield with both a mass and a volume row always has a
    // row in the quantity's own dimension.
    const same = yields.find((y) => y.unit.dimension === unit.dimension);
    return same ? canonical(amount) / canonical(same) : null;
}

// ---------- the calculation over loaded data ----------

type LoadedIngredient = Pick<RecipeIngredientType, 'type'> & {
    _id: Types.ObjectId;
    quantity: string | null;
    unit: string | null;
    size: string | null;
    prepMethod: string | null;
    ingredient: string;
};

interface LoadedRecipe {
    _id: string;
    title: string;
    ingredients: LoadedIngredient[];
    yields: Array<{ quantity: string; unit: string }>;
}

/** The record with no prep method, keyed as the empty string. */
const NO_PREP = '';

export interface NutritionData {
    recipes: Map<string, LoadedRecipe>;
    /** Per ingredient, the perGram of each record, keyed by prep method id. */
    perGram: Map<string, Map<string, MacroNutrients>>;
    measures: Map<string, MeasureData[]>;
    ingredientNames: Map<string, string>;
    units: Map<string, UnitData>;
    sizeNames: Map<string, string>;
}

interface Calculated extends RecipeNutrition {
    /** Ingredients not fully counted: UNCOUNTED and PARTIAL. */
    notCounted: number;
}

export function perGramFor(
    records: Map<string, MacroNutrients> | undefined,
    prepMethodId: string | null
): MacroNutrients | undefined {
    return (prepMethodId ? records?.get(prepMethodId) : undefined) ?? records?.get(NO_PREP);
}

function uncounted(
    recipeIngredient: LoadedIngredient,
    code: UncountedCode,
    message: string
): IngredientNutrition {
    return {
        recipeIngredient: recipeIngredient._id,
        status: 'UNCOUNTED',
        macros: { ...ZERO_MACROS },
        reason: { code, message },
        childUncounted: null,
        childRecipe: recipeIngredient.type === 'recipe' ? recipeIngredient.ingredient : null,
    };
}

function counted(recipeIngredient: LoadedIngredient, macros: MacroNutrients): IngredientNutrition {
    return {
        recipeIngredient: recipeIngredient._id,
        status: 'COUNTED',
        macros,
        reason: null,
        childUncounted: null,
        childRecipe: recipeIngredient.type === 'recipe' ? recipeIngredient.ingredient : null,
    };
}

/**
 * Calculates a loaded recipe. `stack` holds the recipes being calculated above it, so a
 * cycle already in the data gives CYCLE on its ingredient instead of never ending. Each recipe is
 * calculated once and memoised, so a recipe used twice costs nothing the second time.
 */
export function calculate(
    recipeId: string,
    data: NutritionData,
    stack: string[] = [],
    memo = new Map<string, Calculated>()
): Calculated {
    const memoised = memo.get(recipeId);
    if (memoised) return memoised;
    const recipe = data.recipes.get(recipeId)!;
    const path = [...stack, recipeId];
    const ingredients = recipe.ingredients.map((recipeIngredient) =>
        calculateIngredient(recipeIngredient, data, path, memo)
    );
    const total = ingredients.reduce((sum, result) => addMacros(sum, result.macros), {
        ...ZERO_MACROS,
    });
    const result = {
        total,
        ingredients,
        notCounted: ingredients.filter((result) => result.status !== 'COUNTED').length,
    };
    memo.set(recipeId, result);
    return result;
}

function calculateIngredient(
    recipeIngredient: LoadedIngredient,
    data: NutritionData,
    path: string[],
    memo: Map<string, Calculated>
): IngredientNutrition {
    // An ingredient with no calories or macros, such as water or salt, adds nothing whatever
    // its amount, so it is counted without a quantity or a weight: "salt, to taste".
    if (recipeIngredient.type === 'ingredient') {
        const records = data.perGram.get(recipeIngredient.ingredient);
        const perGram = perGramFor(records, recipeIngredient.prepMethod);
        if (perGram && isZero(perGram)) return counted(recipeIngredient, { ...ZERO_MACROS });
    }
    if (!recipeIngredient.quantity)
        return uncounted(recipeIngredient, 'NO_QUANTITY', 'No quantity');
    const quantity = quantityToFloat(recipeIngredient.quantity);
    if (!Number.isFinite(quantity))
        return uncounted(recipeIngredient, 'NO_QUANTITY', 'Could not read the quantity');
    const unit = recipeIngredient.unit ? data.units.get(recipeIngredient.unit) : undefined;
    if (!unit) return uncounted(recipeIngredient, 'NO_MEASURE', 'No unit');

    if (recipeIngredient.type === 'recipe') {
        return calculateRecipeIngredient(recipeIngredient, quantity, unit, data, path, memo);
    }
    const name = data.ingredientNames.get(recipeIngredient.ingredient) ?? 'this ingredient';
    const records = data.perGram.get(recipeIngredient.ingredient);
    const perGram = perGramFor(records, recipeIngredient.prepMethod);
    if (!perGram)
        return uncounted(recipeIngredient, 'NO_NUTRITION', `No nutritional data for ${name}`);
    const prepared = !!recipeIngredient.prepMethod && records?.has(recipeIngredient.prepMethod);
    const measures = (data.measures.get(recipeIngredient.ingredient) ?? []).filter(
        (m) => !prepared || m.prepMethod === recipeIngredient.prepMethod
    );
    const perUnit =
        unit.dimension === 'mass'
            ? unit.perCanonical
            : gramsPerUnit(measures, {
                  unit,
                  sizeId: recipeIngredient.size,
                  prepMethodId: recipeIngredient.prepMethod,
              });
    if (perUnit === null) {
        const sizeName = recipeIngredient.size ? data.sizeNames.get(recipeIngredient.size) : null;
        return uncounted(
            recipeIngredient,
            'NO_MEASURE',
            `No weight recorded for ${describeOneUnit(unit, name, sizeName)}`
        );
    }
    return counted(recipeIngredient, scaleMacros(perGram, quantity * perUnit));
}

function calculateRecipeIngredient(
    recipeIngredient: LoadedIngredient,
    quantity: number,
    unit: UnitData,
    data: NutritionData,
    path: string[],
    memo: Map<string, Calculated>
): IngredientNutrition {
    const childId = recipeIngredient.ingredient;
    if (path.includes(childId)) {
        return uncounted(
            recipeIngredient,
            'CYCLE',
            'This recipe uses itself through its ingredients'
        );
    }
    const child = data.recipes.get(childId);
    if (!child) {
        // Not loaded: deeper than MAX_DEPTH, or deleted.
        return path.length >= MAX_DEPTH
            ? uncounted(
                  recipeIngredient,
                  'DEPTH_LIMIT',
                  `Recipes are nested more than ${MAX_DEPTH} deep`
              )
            : uncounted(recipeIngredient, 'NO_NUTRITION', 'The recipe it uses no longer exists');
    }
    const yields = child.yields.flatMap((row) => {
        const rowUnit = data.units.get(row.unit);
        const rowQuantity = quantityToFloat(row.quantity);
        return rowUnit && rowQuantity > 0 ? [{ quantity: rowQuantity, unit: rowUnit }] : [];
    });
    const fraction = yieldFraction(quantity, unit, yields);
    if (fraction === null) {
        const what =
            unit.dimension === 'count' && !unit.hidden ? `${unit.longSingular}s` : unit.dimension;
        return uncounted(
            recipeIngredient,
            'NO_YIELD',
            yields.length === 0
                ? `No yield recorded for ${child.title}`
                : `No yield in ${what} recorded for ${child.title}`
        );
    }
    const result = calculate(childId, data, path, memo);
    const macros = scaleMacros(result.total, fraction);
    if (result.notCounted === 0) return counted(recipeIngredient, macros);
    return {
        ...counted(recipeIngredient, macros),
        status: 'PARTIAL',
        reason: {
            code: 'CHILD_PARTIAL',
            message: `${result.notCounted} of ${result.ingredients.length} ingredients in ${child.title} not counted`,
        },
        childUncounted: result.notCounted,
    };
}

// ---------- loading ----------

function asId(value: unknown): string | null {
    if (value == null) return null;
    const withId = value as { _id?: unknown };
    return String(withId._id ?? value);
}

/**
 * Loads everything a recipe's calculation needs: the recipe tree breadth-first, one query a
 * level, then the nutrition, measures, names, units and sizes of every ingredient in one
 * query each.
 */
export async function loadNutritionData(rootId: string): Promise<NutritionData> {
    const recipes = new Map<string, LoadedRecipe>();
    let level = [rootId];
    for (let depth = 0; level.length > 0 && depth < MAX_DEPTH; depth++) {
        const docs = await Recipe.find({ _id: { $in: level } })
            .select('title yield ingredientSubsections')
            .lean();
        const next = new Set<string>();
        for (const doc of docs) {
            const ingredients: LoadedIngredient[] = doc.ingredientSubsections.flatMap(
                (subsection) =>
                    subsection.ingredients.map((recipeIngredient: RecipeIngredientType) => ({
                        _id: recipeIngredient._id as Types.ObjectId,
                        type: recipeIngredient.type,
                        quantity: recipeIngredient.quantity ?? null,
                        unit: asId(recipeIngredient.unit),
                        size: asId(recipeIngredient.size),
                        prepMethod: asId(recipeIngredient.prepMethod),
                        ingredient: asId(recipeIngredient.ingredient)!,
                    }))
            );
            recipes.set(String(doc._id), {
                _id: String(doc._id),
                title: doc.title,
                ingredients,
                yields: (doc.yield ?? []).map((row: RecipeYield) => ({
                    quantity: row.quantity,
                    unit: String(row.unit),
                })),
            });
            for (const recipeIngredient of ingredients) {
                if (recipeIngredient.type === 'recipe' && !recipes.has(recipeIngredient.ingredient))
                    next.add(recipeIngredient.ingredient);
            }
        }
        level = [...next];
    }

    const all = [...recipes.values()];
    const used = all.flatMap((recipe) => recipe.ingredients);
    const ingredientIds = [
        ...new Set(used.filter((i) => i.type === 'ingredient').map((i) => i.ingredient)),
    ];
    const unitIds = new Set([
        ...used.flatMap((recipeIngredient) =>
            recipeIngredient.unit ? [recipeIngredient.unit] : []
        ),
        ...all.flatMap((recipe) => recipe.yields.map((row) => row.unit)),
    ]);
    const sizeIds = [
        ...new Set(
            used.flatMap((recipeIngredient) =>
                recipeIngredient.size ? [recipeIngredient.size] : []
            )
        ),
    ];

    const [infos, measureDocs, ingredients, sizes] = await Promise.all([
        NutritionalInfo.find({ ingredient: { $in: ingredientIds } }).lean(),
        IngredientMeasure.find({ ingredient: { $in: ingredientIds } }).lean(),
        Ingredient.find({ _id: { $in: ingredientIds } })
            .select('name')
            .lean(),
        Size.find({ _id: { $in: sizeIds } })
            .select('value')
            .lean(),
    ]);
    measureDocs.forEach((measure) => unitIds.add(String(measure.unit)));
    const unitDocs = await Unit.find({ _id: { $in: [...unitIds] } })
        .select('longSingular hidden dimension perCanonical')
        .lean();
    const units = new Map<string, UnitData>(unitDocs.map((unit) => [String(unit._id), unit]));

    const measures = new Map<string, MeasureData[]>();
    for (const measure of measureDocs) {
        const unit = units.get(String(measure.unit));
        if (!unit) continue;
        const key = String(measure.ingredient);
        measures.set(key, [
            ...(measures.get(key) ?? []),
            {
                unit,
                size: asId(measure.size),
                prepMethod: asId(measure.prepMethod),
                grams: measure.grams,
            },
        ]);
    }
    const perGram = new Map<string, Map<string, MacroNutrients>>();
    for (const info of infos) {
        const key = String(info.ingredient);
        const records = perGram.get(key) ?? new Map<string, MacroNutrients>();
        records.set(asId(info.prepMethod) ?? NO_PREP, info.perGram);
        perGram.set(key, records);
    }
    return {
        recipes,
        perGram,
        measures,
        ingredientNames: new Map(ingredients.map((i) => [String(i._id), i.name])),
        units,
        sizeNames: new Map(sizes.map((size) => [String(size._id), size.value])),
    };
}

/** A recipe's nutrition, or null when the recipe does not exist. */
export async function recipeNutrition(recipeId: string): Promise<RecipeNutrition | null> {
    const data = await loadNutritionData(recipeId);
    if (!data.recipes.has(recipeId)) return null;
    const { total, ingredients } = calculate(recipeId, data);
    return { total, ingredients };
}
