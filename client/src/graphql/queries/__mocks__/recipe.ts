import { COUNT_RECIPES, GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';

import { mockApple } from './ingredient';
import { mockDiced } from './prepMethod';
import { mockCup, mockOunce, mockTeaspoon } from './unit';
import { mockDinnerTag, mockLunchTag } from './tag';

export const mockRecipeOne = {
    __typename: 'Recipe',
    _id: '60f4d2e5c3d5a0a4f1b9c0eb',
    title: 'Mock Recipe',
    pluralTitle: null,
    titleIdentifier: 'mock-recipe-one',
    instructions: ['Instruction one', 'Instruction two'],
    ingredients: [
        {
            // normal ingredient
            type: 'ingredient',
            quantity: '1',
            unit: mockTeaspoon,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with no unit
            type: 'ingredient',
            quantity: '1',
            unit: null,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with no unit and plural quantity
            type: 'ingredient',
            quantity: '2',
            unit: null,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with fraction quantity
            type: 'ingredient',
            quantity: '1/3',
            unit: mockCup,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with no prep method
            type: 'ingredient',
            quantity: '1',
            unit: mockOunce,
            ingredient: mockApple,
            prepMethod: null,
        },
    ],
    tags: [mockDinnerTag, mockLunchTag],
    calculatedTags: ['vegan', 'vegetarian'],
    numServings: 4,
    isIngredient: false,
    notes: null,
    images: [],
    source: null,
};
export const mockRecipeTwo = {
    ...mockRecipeOne,
    _id: '60f4d2e5c3d5a0a4f1b9c0ec',
    title: 'Mock Recipe Two',
    titleIdentifier: 'mock-recipe-two',
};

// GetRecipe
export const mockGetRecipe = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: undefined } },
    },
    result: { data: { recipeOne: mockRecipeOne } },
};
export const mockGetRecipeOne = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
    },
    result: { data: { recipeOne: mockRecipeOne } },
};
// GetRecipes
export const mockGetRecipes = {
    request: {
        query: GET_RECIPES,
        variables: { offset: 0, limit: 10 },
    },
    result: {
        data: {
            recipeMany: [mockRecipeOne, mockRecipeTwo],
        },
    },
};
export const mockCountRecipes = {
    request: {
        query: COUNT_RECIPES,
    },
    result: {
        data: {
            recipeCount: 2,
        },
    },
};
