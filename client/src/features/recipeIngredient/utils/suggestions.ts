import { matchSorter } from 'match-sorter';

import { RecipeIngredientQueryData } from '@recipe/types';
import { IngredientAndRecipe, RecipeFromIngredientsMany } from '@recipe/types';
import { Ingredient, PrepMethod, Size, Unit } from '@recipe/graphql/generated';

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
const sortUnits = (units: Unit[], value: string): UnitSuggestion[] => {
    return matchSorter<Unit>(units, value, {
        keys: ['longSingular', 'longPlural'],
    }).map((item) => ({ value: item }));
};
const sortSizes = (sizes: Size[], value: string): SizeSuggestion[] => {
    return matchSorter<Size>(sizes, value, {
        keys: ['value'],
    }).map((item) => ({ value: item }));
};
const sortIngredients = (
    ingredients: Ingredient[],
    recipes: RecipeFromIngredientsMany[],
    value: string
): IngredientSuggestion[] => {
    return matchSorter<IngredientAndRecipe>([...ingredients, ...recipes], value, {
        keys: ['name', 'pluralName', 'title', 'pluralTitle'],
    }).map((item) => ({ value: item }));
};
const sortPrepMethods = (prepMethods: PrepMethod[], value: string): PrepMethodSuggestion[] => {
    return matchSorter<PrepMethod>(prepMethods, value, {
        keys: ['value'],
    }).map((item) => ({ value: item }));
};
export const unitSuggestions = (
    data: RecipeIngredientQueryData,
    value: string
): UnitSuggestion[] => {
    const items = sortUnits(data?.units ?? [], value);
    const sizes = sortSizes(data?.sizes ?? [], value);
    const ingredients = sortIngredients(data?.ingredients ?? [], data?.recipes ?? [], value);
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
    const items = sortSizes(data?.sizes ?? [], value);
    const ingredients = sortIngredients(data?.ingredients ?? [], data?.recipes ?? [], value);
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
    const items = sortIngredients(data?.ingredients ?? [], data?.recipes ?? [], value);
    items.push({ value: 'add new ingredient', colour: 'gray.400' });
    return items;
};

export const prepMethodSuggestions = (
    data: RecipeIngredientQueryData,
    value: string
): PrepMethodSuggestion[] => {
    const items = sortPrepMethods(data?.prepMethods ?? [], value);
    if (value === '') {
        items.unshift({ value: 'skip prep method', colour: 'gray.400' });
    } else {
        items.push({ value: 'add new prep method', colour: 'gray.400' });
        items.push({ value: 'use "' + value + '" as prep method', colour: 'gray.400' });
    }
    return items;
};
