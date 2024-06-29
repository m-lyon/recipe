import { mockImageTwo } from '@recipe/graphql/mutations/__mocks__/image';
import { EnumRecipeIngredientType, GetRecipesQuery } from '@recipe/graphql/generated';
import { COUNT_RECIPES, GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockIdOne, mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';

import { mockApple } from './ingredient';
import { mockDiced } from './prepMethod';
import { mockDinnerTag, mockLunchTag } from './tag';
import { mockCup, mockOunce, mockTeaspoon } from './unit';

export const mockRecipeOne = {
    __typename: 'Recipe' as const,
    _id: mockIdOne,
    title: mockTitleOne,
    pluralTitle: null,
    titleIdentifier: 'mock-recipe-one',
    instructions: ['Instruction one', 'Instruction two'],
    ingredients: [
        {
            // normal ingredient
            type: 'ingredient' as EnumRecipeIngredientType,
            quantity: '1',
            unit: mockTeaspoon,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with no unit
            type: 'ingredient' as EnumRecipeIngredientType,
            quantity: '1',
            unit: null,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with no unit and plural quantity
            type: 'ingredient' as EnumRecipeIngredientType,
            quantity: '2',
            unit: null,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with fraction quantity
            type: 'ingredient' as EnumRecipeIngredientType,
            quantity: '1/3',
            unit: mockCup,
            ingredient: mockApple,
            prepMethod: mockDiced,
        },
        {
            // ingredient with no prep method
            type: 'ingredient' as EnumRecipeIngredientType,
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
    title: mockTitleTwo,
    tags: [],
    titleIdentifier: 'mock-recipe-two',
    isIngredient: true,
    pluralTitle: 'Mock Recipes Two',
    images: [mockImageTwo],
};
export const mockRecipeThree = {
    ...mockRecipeOne,
    _id: '60f4d3e5c3d5a0a4f1b9c0ec',
    title: 'Mock Recipe Three',
    titleIdentifier: 'mock-recipe-three',
    tags: [],
    source: 'Example',
    notes: 'Notes',
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
export const mockGetRecipeTwo = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'mock-recipe-two' } },
    },
    result: { data: { recipeOne: mockRecipeTwo } },
};
export const mockGetRecipeThree = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'mock-recipe-three' } },
    },
    result: { data: { recipeOne: mockRecipeThree } },
};
// GetRecipes
export const mockGetRecipes = {
    request: {
        query: GET_RECIPES,
        variables: { offset: 0, limit: 10 },
    },
    result: {
        data: {
            recipeMany: [
                mockRecipeOne,
                mockRecipeTwo,
                mockRecipeThree,
            ] as GetRecipesQuery['recipeMany'],
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
