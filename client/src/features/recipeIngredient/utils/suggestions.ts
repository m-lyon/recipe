import { matchSorter } from 'match-sorter';

interface UnitSuggestion {
    value: string | UnitChoice | SizeChoice | IngredientOrRecipeChoice;
    colour?: string;
}
interface SizeSuggestion {
    value: string | SizeChoice | IngredientOrRecipeChoice;
    colour?: string;
}
interface IngredientSuggestion {
    value: string | IngredientOrRecipeChoice;
    colour?: string;
}
interface PrepMethodSuggestion {
    value: string | PrepMethodChoice;
    colour?: string;
}
export interface Suggestion {
    value: RecipeIngredientDropdown;
    colour?: string;
}
const sortUnits = (units: UnitChoice[], value: string): UnitSuggestion[] => {
    return matchSorter<UnitChoice>(units, value, {
        keys: ['longSingular', 'longPlural'],
    }).map((item) => ({ value: item }));
};
const sortSizes = (sizes: SizeChoice[], value: string): SizeSuggestion[] => {
    return matchSorter<SizeChoice>(sizes, value, {
        keys: ['value'],
    }).map((item) => ({ value: item }));
};
const sortIngredients = (
    ingredients: IngredientChoice[],
    recipes: RecipeChoice[],
    value: string
): IngredientSuggestion[] => {
    return matchSorter<IngredientOrRecipeChoice>([...ingredients, ...recipes], value, {
        keys: ['name', 'pluralName', 'title', 'pluralTitle'],
    }).map((item) => ({ value: item }));
};
const sortPrepMethods = (
    prepMethods: PrepMethodChoice[],
    value: string
): PrepMethodSuggestion[] => {
    return matchSorter<PrepMethodChoice>(prepMethods, value, {
        keys: ['value'],
    }).map((item) => ({ value: item }));
};
const unitSuggestions = (data: IngredientComponentQuery, value: string): UnitSuggestion[] => {
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

const sizeSuggestions = (data: IngredientComponentQuery, value: string): SizeSuggestion[] => {
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

const ingredientSuggestions = (
    data: IngredientComponentQuery,
    value: string
): IngredientSuggestion[] => {
    const items = sortIngredients(data?.ingredients ?? [], data?.recipes ?? [], value);
    items.push({ value: 'add new ingredient', colour: 'gray.400' });
    return items;
};

const prepMethodSuggestions = (
    data: IngredientComponentQuery,
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

export const getSuggestions = (
    item: EditableRecipeIngredient,
    data: IngredientComponentQuery,
    strValue: string
): Suggestion[] => {
    switch (item.state) {
        case 'quantity':
            return strValue ? [] : [{ value: 'skip quantity', colour: 'gray.400' }];
        case 'unit':
            return unitSuggestions(data, strValue);
        case 'size':
            return sizeSuggestions(data, strValue);
        case 'ingredient':
            return ingredientSuggestions(data, strValue);
        case 'prepMethod':
            return prepMethodSuggestions(data, strValue);
        default:
            return [];
    }
};
