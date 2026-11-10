import { readFileSync } from 'node:fs';

import { indent } from './format.js';
import type { ApiClient } from '../graphql/client.js';
import { matchNamed, matchUnit } from './measures.js';
import { isMongoId, matchIngredient } from './resolve.js';
import { CliError, notFound, rejected } from './errors.js';
import { GET_RECIPE_FILE_COMPONENTS } from '../graphql/operations.js';
import type { IngredientSummary, NamedSummary, RecipeSummary, UnitSummary } from './types.js';
import { GET_RECIPE_FILE_BY_ID, GET_RECIPE_FILE_BY_IDENTIFIER } from '../graphql/operations.js';

/**
 * A recipe as a JSON file: references are names (or MongoIDs), not ids, so that a person or
 * an agent can write one. `recipes export` writes this shape, and `recipes create` and
 * `recipes update` read it.
 */
export interface RecipeFileLine {
    quantity?: string | null;
    unit?: string | null;
    size?: string | null;
    prepMethod?: string | null;
    /** An ingredient, by name, plural name or MongoID. */
    ingredient?: string;
    /** A recipe marked as an ingredient, by titleIdentifier or MongoID. */
    recipe?: string;
}

export interface RecipeFileYield {
    quantity: string;
    unit: string;
}

export interface RecipeFile {
    title?: string;
    pluralTitle?: string | null;
    subTitle?: string | null;
    source?: string | null;
    notes?: string | null;
    numServings?: number;
    isIngredient?: boolean;
    tags?: string[] | null;
    yield?: RecipeFileYield[] | null;
    ingredientSubsections?: Array<{ name?: string | null; ingredients: RecipeFileLine[] }>;
    instructionSubsections?: Array<{ name?: string | null; instructions: string[] }>;
}

export const RECIPE_FILE_KEYS = [
    'title',
    'pluralTitle',
    'subTitle',
    'source',
    'notes',
    'numServings',
    'isIngredient',
    'tags',
    'yield',
    'ingredientSubsections',
    'instructionSubsections',
] as const;
export type RecipeFileKey = (typeof RECIPE_FILE_KEYS)[number];

const REQUIRED_TO_CREATE: RecipeFileKey[] = [
    'title',
    'numServings',
    'ingredientSubsections',
    'instructionSubsections',
];

const LINE_KEYS = ['quantity', 'unit', 'size', 'prepMethod', 'ingredient', 'recipe'];

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Collects every problem in a file, so that one run reports all of them. */
class Problems {
    readonly list: string[] = [];

    add(path: string, message: string): void {
        this.list.push(`${path}: ${message}`);
    }

    unknownKeys(path: string, value: Json, allowed: readonly string[]): void {
        for (const key of Object.keys(value)) {
            if (!allowed.includes(key)) this.add(path, `unknown key "${key}"`);
        }
    }

    optionalString(path: string, value: unknown): void {
        if (value !== undefined && value !== null && typeof value !== 'string') {
            this.add(path, 'must be a string or null');
        }
    }

    name(path: string, value: unknown): void {
        if (typeof value !== 'string' || value.trim() === '') {
            this.add(path, 'must be a non-empty string');
        }
    }
}

/** A quantity may be written as a number for convenience; the API stores a string. */
function quantityOf(value: unknown): string | null | undefined {
    return typeof value === 'number' ? String(value) : (value as string | null | undefined);
}

function checkLine(problems: Problems, path: string, line: unknown): void {
    if (!isObject(line)) {
        problems.add(path, 'must be an object');
        return;
    }
    problems.unknownKeys(path, line, LINE_KEYS);
    const quantity = line.quantity;
    if (quantity !== undefined && quantity !== null && typeof quantity !== 'string') {
        if (typeof quantity !== 'number') problems.add(`${path}.quantity`, 'must be a string');
    }
    for (const key of ['unit', 'size', 'prepMethod']) {
        problems.optionalString(`${path}.${key}`, line[key]);
    }
    const hasIngredient = line.ingredient !== undefined;
    const hasRecipe = line.recipe !== undefined;
    if (hasIngredient === hasRecipe) {
        problems.add(path, 'needs exactly one of "ingredient" and "recipe"');
    } else {
        const key = hasIngredient ? 'ingredient' : 'recipe';
        problems.name(`${path}.${key}`, line[key]);
    }
}

function checkSubsections(
    problems: Problems,
    key: 'ingredientSubsections' | 'instructionSubsections',
    value: unknown
): void {
    const itemsKey = key === 'ingredientSubsections' ? 'ingredients' : 'instructions';
    if (!Array.isArray(value) || value.length === 0) {
        problems.add(key, 'must be a non-empty array');
        return;
    }
    value.forEach((subsection, i) => {
        const path = `${key}[${i}]`;
        if (!isObject(subsection)) {
            problems.add(path, 'must be an object');
            return;
        }
        problems.unknownKeys(path, subsection, ['name', itemsKey]);
        problems.optionalString(`${path}.name`, subsection.name);
        if (value.length > 1 && (typeof subsection.name !== 'string' || !subsection.name)) {
            problems.add(`${path}.name`, 'is required when there is more than one subsection');
        }
        const items = subsection[itemsKey];
        if (!Array.isArray(items) || items.length === 0) {
            problems.add(`${path}.${itemsKey}`, 'must be a non-empty array');
            return;
        }
        items.forEach((item, j) => {
            const itemPath = `${path}.${itemsKey}[${j}]`;
            if (itemsKey === 'ingredients') {
                checkLine(problems, itemPath, item);
            } else {
                problems.name(itemPath, item);
            }
        });
    });
}

/**
 * Parses and checks the shape of a recipe file. Every key is optional here; `create` needs
 * the keys in REQUIRED_TO_CREATE. Exits 6 with every problem when the file is not valid.
 */
export function parseRecipeFile(raw: string, mode: 'create' | 'update'): RecipeFile {
    let value: unknown;
    try {
        value = JSON.parse(raw);
    } catch (error) {
        throw rejected(`The recipe file is not valid JSON: ${(error as Error).message}`);
    }
    if (!isObject(value)) {
        throw rejected('The recipe file must hold one JSON object.');
    }
    const problems = new Problems();
    problems.unknownKeys('recipe', value, RECIPE_FILE_KEYS);
    if (mode === 'create') {
        for (const key of REQUIRED_TO_CREATE) {
            if (value[key] === undefined || value[key] === null) {
                problems.add(key, 'is required to create a recipe');
            }
        }
    }
    if (value.title !== undefined) problems.name('title', value.title);
    for (const key of ['pluralTitle', 'subTitle', 'source', 'notes']) {
        problems.optionalString(key, value[key]);
    }
    if (value.numServings !== undefined) {
        const servings = value.numServings;
        if (typeof servings !== 'number' || !(servings > 0)) {
            problems.add('numServings', 'must be a positive number');
        }
    }
    if (value.isIngredient !== undefined && typeof value.isIngredient !== 'boolean') {
        problems.add('isIngredient', 'must be true or false');
    }
    if (value.tags !== undefined && value.tags !== null) {
        if (!Array.isArray(value.tags)) {
            problems.add('tags', 'must be an array of tag names');
        } else {
            value.tags.forEach((tag, i) => problems.name(`tags[${i}]`, tag));
        }
    }
    if (value.yield !== undefined && value.yield !== null) {
        if (!Array.isArray(value.yield)) {
            problems.add('yield', 'must be an array');
        } else {
            value.yield.forEach((row, i) => {
                const path = `yield[${i}]`;
                if (!isObject(row)) {
                    problems.add(path, 'must be an object');
                    return;
                }
                problems.unknownKeys(path, row, ['quantity', 'unit']);
                if (typeof row.quantity !== 'string' && typeof row.quantity !== 'number') {
                    problems.add(`${path}.quantity`, 'must be a string');
                }
                problems.name(`${path}.unit`, row.unit);
            });
        }
    }
    for (const key of ['ingredientSubsections', 'instructionSubsections'] as const) {
        if (value[key] !== undefined) checkSubsections(problems, key, value[key]);
    }
    if (problems.list.length > 0) {
        throw rejected(`The recipe file has ${count(problems.list.length, 'problem')}.`, {
            problems: problems.list,
        });
    }
    return value as RecipeFile;
}

/** Everything a recipe file can name. */
export interface RecipeFileComponents {
    ingredients: IngredientSummary[];
    recipes: RecipeSummary[];
    units: UnitSummary[];
    sizes: NamedSummary[];
    prepMethods: NamedSummary[];
    tags: NamedSummary[];
}

export interface RecipeRecordLine {
    quantity: string | null;
    unit: string | null;
    size: string | null;
    prepMethod: string | null;
    ingredient: string;
}

/** The record for `recipeCreateOne` and `recipeUpdateById`: only the keys the file sets. */
export interface RecipeRecord {
    title?: string;
    pluralTitle?: string | null;
    subTitle?: string | null;
    source?: string | null;
    notes?: string | null;
    numServings?: number;
    isIngredient?: boolean;
    tags?: string[];
    yield?: Array<{ quantity: string; unit: string }>;
    ingredientSubsections?: Array<{ name: string | null; ingredients: RecipeRecordLine[] }>;
    instructionSubsections?: Array<{ name: string | null; instructions: string[] }>;
}

export interface ResolvedRecipe {
    record: RecipeRecord;
    /** Each ingredient line as it would read in the recipe, per subsection. */
    lines: Array<{ name: string | null; lines: string[] }>;
}

function count(n: number, noun: string): string {
    return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * Resolves every name in a recipe file to an id. A MongoID is passed through as it is, so
 * that a file can name a one-recipe unit, size or prep method, which no list shows.
 * Exits 4 with every reference that does not resolve.
 */
export function resolveRecipeFile(
    file: RecipeFile,
    components: RecipeFileComponents
): ResolvedRecipe {
    const missing: Array<{ path: string; message: string; candidates?: unknown }> = [];

    function named<T extends { _id: string }>(
        path: string,
        kind: string,
        term: string,
        find: (term: string) => T | undefined
    ): T | { _id: string } | null {
        if (isMongoId(term)) return { _id: term };
        const found = find(term);
        if (!found) {
            missing.push({ path, message: `no ${kind} named "${term}"` });
            return null;
        }
        return found;
    }

    const record: RecipeRecord = {};
    for (const key of ['title', 'pluralTitle', 'subTitle', 'source', 'notes'] as const) {
        if (file[key] !== undefined) record[key] = file[key] as string;
    }
    if (file.numServings !== undefined) record.numServings = file.numServings;
    if (file.isIngredient !== undefined) record.isIngredient = file.isIngredient;

    if (file.tags !== undefined) {
        record.tags = (file.tags ?? [])
            .map((tag, i) => named(`tags[${i}]`, 'tag', tag, (t) => matchNamed(components.tags, t)))
            .filter((tag): tag is { _id: string } => tag !== null)
            .map((tag) => tag._id);
    }
    if (file.yield !== undefined) {
        record.yield = (file.yield ?? []).flatMap((row, i) => {
            const unit = named(`yield[${i}].unit`, 'unit', row.unit, (u) =>
                matchUnit(components.units, u)
            );
            return unit ? [{ quantity: String(quantityOf(row.quantity)), unit: unit._id }] : [];
        });
    }

    const lines: ResolvedRecipe['lines'] = [];
    if (file.ingredientSubsections !== undefined) {
        record.ingredientSubsections = file.ingredientSubsections.map((subsection, i) => {
            const shown: string[] = [];
            const ingredients = subsection.ingredients.flatMap((line, j) => {
                const path = `ingredientSubsections[${i}].ingredients[${j}]`;
                const unit = line.unit
                    ? named(`${path}.unit`, 'unit', line.unit, (u) =>
                          matchUnit(components.units, u)
                      )
                    : null;
                const size = line.size
                    ? named(`${path}.size`, 'size', line.size, (s) =>
                          matchNamed(components.sizes, s)
                      )
                    : null;
                const prep = line.prepMethod
                    ? named(`${path}.prepMethod`, 'prep method', line.prepMethod, (p) =>
                          matchNamed(components.prepMethods, p)
                      )
                    : null;
                const target = line.recipe
                    ? resolveRecipeLine(`${path}.recipe`, line.recipe, components.recipes, missing)
                    : resolveIngredientLine(
                          `${path}.ingredient`,
                          line.ingredient!,
                          components.ingredients,
                          missing
                      );
                if (!target) return [];
                const quantity = quantityOf(line.quantity) ?? null;
                shown.push(
                    describeLine(quantity, unit, size, prep, target.name, Boolean(line.recipe))
                );
                return [
                    {
                        quantity,
                        unit: unit?._id ?? null,
                        size: size?._id ?? null,
                        prepMethod: prep?._id ?? null,
                        ingredient: target._id,
                    },
                ];
            });
            lines.push({ name: subsection.name ?? null, lines: shown });
            return { name: subsection.name ?? null, ingredients };
        });
    }
    if (file.instructionSubsections !== undefined) {
        record.instructionSubsections = file.instructionSubsections.map((subsection) => ({
            name: subsection.name ?? null,
            instructions: subsection.instructions,
        }));
    }

    if (missing.length > 0) {
        throw notFound(
            `${count(missing.length, 'reference')} in the recipe file did not resolve: ` +
                missing.map((m) => `${m.path}: ${m.message}`).join('; ') +
                '.',
            { problems: missing }
        );
    }
    return { record, lines };
}

function resolveIngredientLine(
    path: string,
    term: string,
    ingredients: IngredientSummary[],
    missing: Array<{ path: string; message: string; candidates?: unknown }>
): { _id: string; name: string } | null {
    try {
        const ingredient = matchIngredient(ingredients, term);
        return { _id: ingredient._id, name: ingredient.name };
    } catch (error) {
        if (!(error instanceof CliError)) throw error;
        missing.push({
            path,
            message: error.message.replace(/\.$/, ''),
            candidates: error.details?.candidates,
        });
        return null;
    }
}

function resolveRecipeLine(
    path: string,
    term: string,
    recipes: RecipeSummary[],
    missing: Array<{ path: string; message: string }>
): { _id: string; name: string } | null {
    const recipe = recipes.find((r) => r._id === term || r.titleIdentifier === term);
    if (recipe) return { _id: recipe._id, name: recipe.title };
    // A recipe the list does not show may still exist; the API checks it.
    if (isMongoId(term)) return { _id: term, name: term };
    missing.push({ path, message: `no recipe with identifier "${term}"` });
    return null;
}

function nameOf(value: { _id: string } | null, key: 'shortSingular' | 'value'): string | null {
    if (!value) return null;
    if (key in value) return (value as Record<string, string>)[key];
    return value._id;
}

/** "2 tbsp olive oil", "1 large onion, diced", "300 g Pearl Couscous (recipe)". */
function describeLine(
    quantity: string | null,
    unit: { _id: string } | null,
    size: { _id: string } | null,
    prep: { _id: string } | null,
    name: string,
    isRecipe: boolean
): string {
    const hiddenUnit = unit && 'hidden' in unit && (unit as UnitSummary).hidden;
    return [
        quantity,
        hiddenUnit ? null : nameOf(unit, 'shortSingular'),
        nameOf(size, 'value'),
        name + (isRecipe ? ' (recipe)' : '') + (prep ? `, ${nameOf(prep, 'value')}` : ''),
    ]
        .filter(Boolean)
        .join(' ');
}

/** The subset of a Recipe that `recipes export` reads. */
export interface RecipeFileSource {
    _id: string;
    title: string;
    titleIdentifier: string;
    pluralTitle?: string | null;
    subTitle?: string | null;
    source?: string | null;
    notes?: string | null;
    numServings: number;
    isIngredient: boolean;
    tags: NamedSummary[];
    yield?: Array<{ quantity: string; unit?: UnitSummary | null }> | null;
    ingredientSubsections: Array<{
        name?: string | null;
        ingredients: Array<{
            quantity?: string | null;
            unit?: UnitSummary | null;
            size?: NamedSummary | null;
            prepMethod?: NamedSummary | null;
            ingredient:
                | ({ __typename: 'Ingredient' } & IngredientSummary)
                | { __typename: 'Recipe'; _id: string; title: string; titleIdentifier: string };
        }>;
    }>;
    instructionSubsections: Array<{ name?: string | null; instructions: string[] }>;
}

/**
 * Writes a recipe as a recipe file. Each reference is a name when that name resolves back to
 * the same object, and its MongoID otherwise (a one-recipe unit, or two ingredients with one
 * name), so that `recipes update` with the exported file changes nothing.
 */
export function toRecipeFile(recipe: RecipeFileSource, components: RecipeFileComponents) {
    const unitRef = (unit: UnitSummary) => {
        for (const name of [unit.shortSingular, unit.longSingular]) {
            if (matchUnit(components.units, name)?._id === unit._id) return name;
        }
        return unit._id;
    };
    const namedRef = (value: NamedSummary, options: NamedSummary[]) =>
        matchNamed(options, value.value)?._id === value._id ? value.value : value._id;
    const ingredientRef = (ingredient: IngredientSummary) => {
        try {
            return matchIngredient(components.ingredients, ingredient.name)._id === ingredient._id
                ? ingredient.name
                : ingredient._id;
        } catch {
            return ingredient._id;
        }
    };

    const file: Required<RecipeFile> = {
        title: recipe.title,
        pluralTitle: recipe.pluralTitle ?? null,
        subTitle: recipe.subTitle ?? null,
        source: recipe.source ?? null,
        notes: recipe.notes ?? null,
        numServings: recipe.numServings,
        isIngredient: recipe.isIngredient,
        tags: recipe.tags.map((tag) => namedRef(tag, components.tags)),
        yield: (recipe.yield ?? [])
            .filter((row) => row.unit)
            .map((row) => ({ quantity: row.quantity, unit: unitRef(row.unit!) })),
        ingredientSubsections: recipe.ingredientSubsections.map((subsection) => ({
            name: subsection.name ?? null,
            ingredients: subsection.ingredients.map((line) => {
                const out: RecipeFileLine = { quantity: line.quantity ?? null };
                // The API stores a line with a quantity and no unit as the hidden each unit.
                if (line.unit && !(line.unit.hidden && line.unit.standard === 'each')) {
                    out.unit = unitRef(line.unit);
                }
                if (line.size) out.size = namedRef(line.size, components.sizes);
                if (line.ingredient.__typename === 'Recipe') {
                    out.recipe = line.ingredient.titleIdentifier;
                } else {
                    out.ingredient = ingredientRef(line.ingredient);
                }
                if (line.prepMethod) {
                    out.prepMethod = namedRef(line.prepMethod, components.prepMethods);
                }
                return out;
            }),
        })),
        instructionSubsections: recipe.instructionSubsections.map((subsection) => ({
            name: subsection.name ?? null,
            instructions: subsection.instructions,
        })),
    };
    return file;
}

/** The keys of `file` whose value differs from the recipe as exported. */
export function changedKeys(file: RecipeFile, current: RecipeFile): RecipeFileKey[] {
    return RECIPE_FILE_KEYS.filter(
        (key) =>
            file[key] !== undefined &&
            JSON.stringify(normalise(key, file[key])) !==
                JSON.stringify(normalise(key, current[key]))
    );
}

/** Makes an exported value and a hand-written one compare equal when they mean the same. */
function normalise(key: RecipeFileKey, value: unknown): unknown {
    if (value === null || value === undefined) {
        return key === 'tags' || key === 'yield' ? [] : null;
    }
    if (key === 'ingredientSubsections') {
        return (value as NonNullable<RecipeFile['ingredientSubsections']>).map((subsection) => ({
            name: subsection.name ?? null,
            ingredients: subsection.ingredients.map((line) => ({
                quantity: quantityOf(line.quantity) ?? null,
                unit: line.unit ?? null,
                size: line.size ?? null,
                prepMethod: line.prepMethod ?? null,
                ingredient: line.ingredient ?? null,
                recipe: line.recipe ?? null,
            })),
        }));
    }
    if (key === 'instructionSubsections') {
        return (value as NonNullable<RecipeFile['instructionSubsections']>).map((s) => ({
            name: s.name ?? null,
            instructions: s.instructions,
        }));
    }
    if (key === 'yield') {
        return (value as RecipeFileYield[]).map((row) => ({
            quantity: quantityOf(row.quantity),
            unit: row.unit,
        }));
    }
    return value;
}

/** Reads a recipe file from a path, or from standard input when the path is "-". */
export function readRecipeFileText(path: string): string {
    try {
        return readFileSync(path === '-' ? 0 : path, 'utf8');
    } catch {
        throw rejected(`Cannot read the recipe file "${path}".`);
    }
}

export async function recipeFileComponents(client: ApiClient): Promise<RecipeFileComponents> {
    const data = await client.request(GET_RECIPE_FILE_COMPONENTS);
    return {
        ingredients: (data.ingredients ?? []).filter(Boolean),
        recipes: data.recipes ?? [],
        units: data.units ?? [],
        sizes: data.sizes ?? [],
        prepMethods: data.prepMethods ?? [],
        tags: data.tags ?? [],
    } as unknown as RecipeFileComponents;
}

/** The recipe as `recipes export` writes it, and the recipe it came from. */
export async function exportRecipe(
    client: ApiClient,
    identifier: string,
    components: RecipeFileComponents
): Promise<{ recipe: RecipeFileSource; file: Required<RecipeFile> }> {
    const recipe = (isMongoId(identifier)
        ? (await client.request(GET_RECIPE_FILE_BY_ID, { id: identifier })).recipeById
        : (await client.request(GET_RECIPE_FILE_BY_IDENTIFIER, { titleIdentifier: identifier }))
              .recipeOne) as unknown as RecipeFileSource | null;
    if (!recipe) {
        throw notFound(`No recipe with identifier "${identifier}".`);
    }
    return { recipe, file: toRecipeFile(recipe, components) };
}

/** The plan a write prints: the fields it sets, and each ingredient line. */
export function describeResolved(resolved: ResolvedRecipe, record: RecipeRecord): string {
    const out: string[] = [];
    for (const key of ['title', 'pluralTitle', 'subTitle', 'source', 'notes'] as const) {
        if (record[key] !== undefined) out.push(`${key}: ${record[key] ?? '—'}`);
    }
    if (record.numServings !== undefined) out.push(`numServings: ${record.numServings}`);
    if (record.isIngredient !== undefined) out.push(`isIngredient: ${record.isIngredient}`);
    if (record.tags !== undefined) out.push(`tags: ${count(record.tags.length, 'tag')}`);
    if (record.yield !== undefined) {
        out.push(`yield: ${record.yield.map((row) => row.quantity).join(', ') || '—'}`);
    }
    if (record.ingredientSubsections !== undefined) {
        out.push('ingredients:');
        for (const subsection of resolved.lines) {
            if (subsection.name) {
                out.push(indent(subsection.name));
                out.push(indent(subsection.lines.join('\n'), 4));
            } else {
                out.push(indent(subsection.lines.join('\n')));
            }
        }
    }
    if (record.instructionSubsections !== undefined) {
        const steps = record.instructionSubsections.reduce(
            (sum, subsection) => sum + subsection.instructions.length,
            0
        );
        out.push(
            `instructions: ${count(steps, 'step')} in ` +
                count(record.instructionSubsections.length, 'subsection')
        );
    }
    return out.join('\n');
}

/**
 * Exits 6 for a recipe marked as an ingredient with no plural title. The web app needs one to
 * name the recipe on its card, and its home page fails to render without it.
 */
export function assertIngredientPlural(
    isIngredient: boolean | undefined,
    pluralTitle: string | null | undefined
): void {
    if (isIngredient && !pluralTitle?.trim()) {
        throw rejected(
            'A recipe marked as an ingredient needs a pluralTitle: the web app shows it on ' +
                'the recipe card. Use the title when the plural is the same ' +
                '("Black Bean Sauce").'
        );
    }
}
