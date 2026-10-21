import { Types } from 'mongoose';

import { Size } from '../models/Size.js';
import { Ingredient } from '../models/Ingredient.js';
import { Unit, UnitDimension } from '../models/Unit.js';
import { IngredientMeasure } from '../models/IngredientMeasure.js';
import { MacroNutrients, NutritionalInfo } from '../models/NutritionalInfo.js';
import { Recipe, RecipeIngredientType, RecipeYield } from '../models/Recipe.js';

/**
 * A recipe's nutrition, calculated on read from its lines (issue #116).
 *
 * Every quantity reaches grams, or a share of a child recipe, before it meets a macro:
 *  - an ingredient line: grams(quantity, unit, measures) × perGram
 *  - a recipe line: (quantity ÷ the child's yield in the same dimension) × the child's total
 * Nothing is stored, so a recipe never needs re-saving when an ingredient's data changes.
 */

/** Recipes nested deeper than this are not followed. */
export const MAX_DEPTH = 10;

export type NutritionStatus = 'COUNTED' | 'PARTIAL' | 'UNCOUNTED';
export type UncountedCode =
    | 'NO_QUANTITY'
    | 'NO_NUTRITION'
    | 'NO_MEASURE'
    | 'NO_YIELD'
    | 'CHILD_PARTIAL'
    | 'CYCLE'
    | 'DEPTH_LIMIT';

export interface LineNutrition {
    recipeIngredient: Types.ObjectId;
    status: NutritionStatus;
    /** What this line contributed: zero when UNCOUNTED. */
    macros: MacroNutrients;
    /** Set when the status is not COUNTED. */
    reason: { code: UncountedCode; message: string } | null;
    /** PARTIAL only: the lines of the child recipe that were not fully counted. */
    childUncounted: number | null;
    /** A recipe line: the recipe it uses, so a client can link to its breakdown. */
    childRecipe: string | null;
}

export interface RecipeNutrition {
    /** The whole batch, as authored. */
    total: MacroNutrients;
    lines: LineNutrition[];
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

export interface UnitData {
    _id: Types.ObjectId | string;
    longSingular: string;
    hidden?: boolean;
    dimension: UnitDimension;
    perCanonical: number;
}

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
 * Grams in one of the key's unit, from the most specific measure that matches:
 *  1. exact (unit, size, prep)
 *  2. drop prep (unit, size)
 *  3. drop size (unit)
 *  4. volume only: the least specific volume row, rescaled by perCanonical
 */
export function gramsPerUnit(measures: MeasureData[], key: MeasureKey): number | null {
    const forUnit = measures.filter((m) => String(m.unit._id) === String(key.unit._id));
    const match =
        forUnit.find((m) => m.size === key.sizeId && m.prepMethod === key.prepMethodId) ??
        forUnit.find((m) => m.size === key.sizeId && m.prepMethod === null) ??
        forUnit.find((m) => m.size === null && m.prepMethod === null);
    if (match) return match.grams;
    if (key.unit.dimension !== 'volume') return null;
    const volume = measures
        .filter((m) => m.unit.dimension === 'volume')
        .sort((a, b) => specificity(a) - specificity(b))[0];
    if (!volume) return null;
    return (volume.grams / volume.unit.perCanonical) * key.unit.perCanonical;
}

/** "1 cup of honey", "1 large onion": the thing whose weight is missing. */
export function describeOneUnit(unit: UnitData, name: string, sizeName?: string | null): string {
    const unitStr = unit.hidden ? '' : `${unit.longSingular} of `;
    return `1 ${unitStr}${sizeName ? `${sizeName} ` : ''}${name}`;
}

export interface YieldRow {
    quantity: number;
    unit: UnitData;
}

/**
 * The share of a child recipe's batch that a line uses, or null when the child's yield has
 * no row to measure the line against.
 *
 * A mass or volume line uses the yield row in its dimension, in canonical units, so grams
 * read against kilograms and tablespoons against cups. A count line needs a row in its exact
 * unit: "1 slice" cannot be read against "2 each".
 */
export function yieldFraction(quantity: number, unit: UnitData, yields: YieldRow[]): number | null {
    const canonical = (row: { quantity: number; unit: UnitData }) =>
        row.quantity * row.unit.perCanonical;
    const line = { quantity, unit };
    if (unit.dimension === 'count') {
        const row = yields.find((y) => String(y.unit._id) === String(unit._id));
        return row ? quantity / row.quantity : null;
    }
    // No density bridge is needed: a yield with both a mass and a volume row always has a
    // row in the line's own dimension.
    const same = yields.find((y) => y.unit.dimension === unit.dimension);
    return same ? canonical(line) / canonical(same) : null;
}

// ---------- the calculation over loaded data ----------

interface LoadedLine {
    _id: Types.ObjectId;
    type: 'ingredient' | 'recipe';
    quantity: string | null;
    unit: string | null;
    size: string | null;
    prepMethod: string | null;
    ingredient: string;
}

interface LoadedRecipe {
    _id: string;
    title: string;
    lines: LoadedLine[];
    yields: Array<{ quantity: string; unit: string }>;
}

export interface NutritionData {
    recipes: Map<string, LoadedRecipe>;
    perGram: Map<string, MacroNutrients>;
    measures: Map<string, MeasureData[]>;
    ingredientNames: Map<string, string>;
    units: Map<string, UnitData>;
    sizeNames: Map<string, string>;
}

interface Calculated extends RecipeNutrition {
    /** Lines not fully counted: UNCOUNTED and PARTIAL. */
    notCounted: number;
}

function uncounted(line: LoadedLine, code: UncountedCode, message: string): LineNutrition {
    return {
        recipeIngredient: line._id,
        status: 'UNCOUNTED',
        macros: { ...ZERO_MACROS },
        reason: { code, message },
        childUncounted: null,
        childRecipe: line.type === 'recipe' ? line.ingredient : null,
    };
}

function counted(line: LoadedLine, macros: MacroNutrients): LineNutrition {
    return {
        recipeIngredient: line._id,
        status: 'COUNTED',
        macros,
        reason: null,
        childUncounted: null,
        childRecipe: line.type === 'recipe' ? line.ingredient : null,
    };
}

/**
 * Calculates a loaded recipe. `stack` holds the recipes being calculated above it, so a
 * cycle already in the data gives CYCLE on its line instead of never ending. Each recipe is
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
    const lines = recipe.lines.map((line) => calculateLine(line, data, path, memo));
    const total = lines.reduce((sum, line) => addMacros(sum, line.macros), { ...ZERO_MACROS });
    const result = {
        total,
        lines,
        notCounted: lines.filter((line) => line.status !== 'COUNTED').length,
    };
    memo.set(recipeId, result);
    return result;
}

function calculateLine(
    line: LoadedLine,
    data: NutritionData,
    path: string[],
    memo: Map<string, Calculated>
): LineNutrition {
    if (!line.quantity) return uncounted(line, 'NO_QUANTITY', 'No quantity');
    const quantity = quantityToFloat(line.quantity);
    if (!Number.isFinite(quantity))
        return uncounted(line, 'NO_QUANTITY', 'Could not read the quantity');
    const unit = line.unit ? data.units.get(line.unit) : undefined;
    if (!unit) return uncounted(line, 'NO_MEASURE', 'No unit');

    if (line.type === 'recipe') {
        return calculateRecipeLine(line, quantity, unit, data, path, memo);
    }
    const name = data.ingredientNames.get(line.ingredient) ?? 'this ingredient';
    const perGram = data.perGram.get(line.ingredient);
    if (!perGram) return uncounted(line, 'NO_NUTRITION', `No nutritional data for ${name}`);
    const perUnit =
        unit.dimension === 'mass'
            ? unit.perCanonical
            : gramsPerUnit(data.measures.get(line.ingredient) ?? [], {
                  unit,
                  sizeId: line.size,
                  prepMethodId: line.prepMethod,
              });
    if (perUnit === null) {
        const sizeName = line.size ? data.sizeNames.get(line.size) : null;
        return uncounted(
            line,
            'NO_MEASURE',
            `No weight recorded for ${describeOneUnit(unit, name, sizeName)}`
        );
    }
    return counted(line, scaleMacros(perGram, quantity * perUnit));
}

function calculateRecipeLine(
    line: LoadedLine,
    quantity: number,
    unit: UnitData,
    data: NutritionData,
    path: string[],
    memo: Map<string, Calculated>
): LineNutrition {
    const childId = line.ingredient;
    if (path.includes(childId)) {
        return uncounted(line, 'CYCLE', 'This recipe uses itself through its ingredients');
    }
    const child = data.recipes.get(childId);
    if (!child) {
        // Not loaded: deeper than MAX_DEPTH, or deleted.
        return path.length >= MAX_DEPTH
            ? uncounted(line, 'DEPTH_LIMIT', `Recipes are nested more than ${MAX_DEPTH} deep`)
            : uncounted(line, 'NO_NUTRITION', 'The recipe it uses no longer exists');
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
            line,
            'NO_YIELD',
            yields.length === 0
                ? `No yield recorded for ${child.title}`
                : `No yield in ${what} recorded for ${child.title}`
        );
    }
    const result = calculate(childId, data, path, memo);
    const macros = scaleMacros(result.total, fraction);
    if (result.notCounted === 0) return counted(line, macros);
    return {
        ...counted(line, macros),
        status: 'PARTIAL',
        reason: {
            code: 'CHILD_PARTIAL',
            message: `${result.notCounted} of ${result.lines.length} ingredients in ${child.title} not counted`,
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
 * level, then the nutrition, measures, names, units and sizes of every line in one query
 * each.
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
            const lines: LoadedLine[] = doc.ingredientSubsections.flatMap((subsection) =>
                subsection.ingredients.map((line: RecipeIngredientType) => ({
                    _id: line._id as Types.ObjectId,
                    type: line.type,
                    quantity: line.quantity ?? null,
                    unit: asId(line.unit),
                    size: asId(line.size),
                    prepMethod: asId(line.prepMethod),
                    ingredient: asId(line.ingredient)!,
                }))
            );
            recipes.set(String(doc._id), {
                _id: String(doc._id),
                title: doc.title,
                lines,
                yields: (doc.yield ?? []).map((row: RecipeYield) => ({
                    quantity: row.quantity,
                    unit: String(row.unit),
                })),
            });
            for (const line of lines) {
                if (line.type === 'recipe' && !recipes.has(line.ingredient))
                    next.add(line.ingredient);
            }
        }
        level = [...next];
    }

    const all = [...recipes.values()];
    const lines = all.flatMap((recipe) => recipe.lines);
    const ingredientIds = [
        ...new Set(lines.filter((l) => l.type === 'ingredient').map((l) => l.ingredient)),
    ];
    const unitIds = new Set([
        ...lines.flatMap((line) => (line.unit ? [line.unit] : [])),
        ...all.flatMap((recipe) => recipe.yields.map((row) => row.unit)),
    ]);
    const sizeIds = [...new Set(lines.flatMap((line) => (line.size ? [line.size] : [])))];

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
    return {
        recipes,
        perGram: new Map(infos.map((info) => [String(info.ingredient), info.perGram])),
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
    const { total, lines } = calculate(recipeId, data);
    return { total, lines };
}
