import { matchSorter } from 'match-sorter';

import { PrepMethod, Size, Unit } from '@recipe/graphql/generated';
import { IngredientAndRecipe, RecipeIngredientQueryData } from '@recipe/types';

export interface UnitSuggestion {
    value: string | Unit | Size | IngredientAndRecipe | PrepMethod;
    colour?: string;
}
export interface SizeSuggestion {
    value: string | Size | IngredientAndRecipe;
    colour?: string;
}
export interface IngredientSuggestion {
    value: string | IngredientAndRecipe;
    colour?: string;
}
export interface PrepMethodSuggestion {
    value: string | PrepMethod;
    colour?: string;
}

export const unitSuggestions = (
    data: RecipeIngredientQueryData,
    value: string
): UnitSuggestion[] => {
    const items = matchSorter<Unit>(data?.units ?? [], value, {
        keys: ['longSingular', 'longPlural'],
    }).map((item) => ({ value: item })) as UnitSuggestion[];
    const sizes = matchSorter<Size>(data?.sizes ?? [], value, {
        keys: ['value'],
    }).map((item) => ({ value: item })) as SizeSuggestion[];
    const ingredients = matchSorter<IngredientAndRecipe>(data?.ingredients ?? [], value, {
        keys: ['name', 'pluralName', 'title', 'pluralTitle'],
    }).map((item) => ({ value: item })) as IngredientSuggestion[];
    items.push(...[...sizes, ...ingredients]);
    if (value === '') {
        items.unshift({ value: 'skip unit', colour: 'gray.400' });
    } else {
        items.push(
            ...[
                { value: 'add new unit', colour: 'gray.400' },
                { value: 'use "' + value + '" as unit', colour: 'gray.400' },
                { value: 'add new size', colour: 'gray.400' },
                { value: 'add new ingredient', colour: 'gray.400' },
            ]
        );
    }
    return items;
};

export const sizeSuggestions = (
    data: RecipeIngredientQueryData,
    value: string
): SizeSuggestion[] => {
    const items = matchSorter<Size>(data?.sizes ?? [], value, {
        keys: ['value'],
    }).map((item) => ({ value: item })) as SizeSuggestion[];
    const ingredients = matchSorter<IngredientAndRecipe>(data?.ingredients ?? [], value, {
        keys: ['name', 'pluralName', 'title', 'pluralTitle'],
    }).map((item) => ({ value: item })) as IngredientSuggestion[];
    items.push(...ingredients);
    if (value === '') {
        items.unshift({ value: 'skip size', colour: 'gray.400' });
    } else {
        items.push(
            ...[
                { value: 'add new size', colour: 'gray.400' },
                { value: 'add new ingredient', colour: 'gray.400' },
            ]
        );
    }
    return items;
};

export const ingredientSuggestions = (
    data: RecipeIngredientQueryData,
    value: string
): IngredientSuggestion[] => {
    const items = matchSorter<IngredientAndRecipe>(
        [...(data?.ingredients ?? []), ...(data?.recipes ?? [])],
        value,
        {
            keys: ['name', 'pluralName', 'title', 'pluralTitle'],
        }
    ).map((item) => ({
        value: item,
        colour: undefined,
    })) satisfies IngredientSuggestion[] as IngredientSuggestion[];
    items.push({ value: 'add new ingredient', colour: 'gray.400' });
    return items;
};

export const prepMethodSuggestions = (
    data: RecipeIngredientQueryData,
    value: string
): PrepMethodSuggestion[] => {
    const items = matchSorter<PrepMethod>(data?.prepMethods ?? [], value, {
        keys: ['value'],
    }).map((item) => ({ value: item })) as PrepMethodSuggestion[];
    if (value === '') {
        items.unshift({ value: 'skip prep method', colour: 'gray.400' });
    } else {
        items.push({ value: 'add new prep method', colour: 'gray.400' });
        items.push({ value: 'use "' + value + '" as prep method', colour: 'gray.400' });
    }
    return items;
};
