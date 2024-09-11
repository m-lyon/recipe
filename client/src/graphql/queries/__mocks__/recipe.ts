import { mockRecipeIngredientIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFour } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFive } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdEight } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdThree } from '@recipe/graphql/__mocks__/ids';
import { mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';
import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdThree, mockRecipeIdTwo } from '@recipe/graphql/__mocks__/ids';
import { EnumRecipeIngredientType, GetRecipesQuery } from '@recipe/graphql/generated';
import { mockImageNew, mockImageTwo } from '@recipe/graphql/mutations/__mocks__/image';
import { COUNT_RECIPES, GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockRecipeIdFour, mockRecipeIngredientIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNewAsIngr, mockRecipeIngredientIdSix } from '@recipe/graphql/__mocks__/ids';

import { mockAdmin } from './user';
import { mockApple } from './ingredient';
import { mockDiced } from './prepMethod';
import { mockCup, mockOunce, mockTeaspoon } from './unit';
import { mockDinnerTag, mockFreezableTag, mockLunchTag } from './tag';

export const mockRecipeOne = {
    __typename: 'Recipe' as const,
    _id: mockRecipeIdOne,
    title: mockTitleOne,
    pluralTitle: null,
    titleIdentifier: 'mock-recipe-one',
    instructionSubsections: [{ name: null, instructions: ['Instruction one', 'Instruction two'] }],
    ingredientSubsections: [
        {
            name: 'Section One',
            ingredients: [
                {
                    // normal ingredient
                    _id: mockRecipeIngredientIdOne,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1',
                    unit: mockTeaspoon,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit
                    _id: mockRecipeIngredientIdTwo,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1',
                    unit: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit and plural quantity
                    _id: mockRecipeIngredientIdThree,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '2',
                    unit: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
            ],
        },
        {
            name: 'Section Two',
            ingredients: [
                {
                    // ingredient with fraction quantity
                    _id: mockRecipeIngredientIdFour,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1/3',
                    unit: mockCup,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no prep method
                    _id: mockRecipeIngredientIdFive,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1',
                    unit: mockOunce,
                    ingredient: mockApple,
                    prepMethod: null,
                },
            ],
        },
    ],
    tags: [mockDinnerTag, mockLunchTag],
    calculatedTags: ['vegan', 'vegetarian'],
    numServings: 4,
    isIngredient: false,
    notes: null,
    images: [],
    source: null,
    owner: mockAdmin,
};
export const mockRecipeTwo = {
    ...mockRecipeOne,
    _id: mockRecipeIdTwo,
    title: mockTitleTwo,
    tags: [],
    titleIdentifier: 'mock-recipe-two',
    isIngredient: true,
    instructionSubsections: [
        { name: 'Instruct One', instructions: ['Instruction one', 'Instruction two'] },
    ],
    pluralTitle: 'Mock Recipes Two',
    images: [mockImageTwo],
    calculatedTags: [],
};
export const mockRecipeThree = {
    ...mockRecipeOne,
    _id: mockRecipeIdThree,
    title: 'Mock Recipe Three',
    titleIdentifier: 'mock-recipe-three',
    tags: [],
    source: 'Example',
    notes: 'Notes',
    calculatedTags: [],
    ingredientSubsections: [
        {
            name: null,
            ingredients: [
                {
                    // normal ingredient
                    _id: mockRecipeIngredientIdOne,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1',
                    unit: mockTeaspoon,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit
                    _id: mockRecipeIngredientIdTwo,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1',
                    unit: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit and plural quantity
                    _id: mockRecipeIngredientIdThree,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '2',
                    unit: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
            ],
        },
    ],
};
export const mockRecipeFour = {
    ...mockRecipeOne,
    _id: mockRecipeIdFour,
    title: 'Mock Recipe Four',
    titleIdentifier: 'mock-recipe-four',
    tags: [],
    calculatedTags: [],
    instructionSubsections: [
        { name: 'Instruct One', instructions: ['Instr #1.', 'Instr #2.'] },
        { name: 'Instruct Two', instructions: ['Instr #3.'] },
    ],
    ingredientSubsections: [
        {
            name: 'First Section',
            ingredients: [
                {
                    _id: mockRecipeIngredientIdEight,
                    type: EnumRecipeIngredientType.Recipe,
                    quantity: '1',
                    unit: mockTeaspoon,
                    ingredient: mockRecipeTwo,
                    prepMethod: null,
                },
            ],
        },
    ],
};
export const mockRecipeNew = {
    _id: mockRecipeIdNew,
    __typename: 'Recipe' as const,
    title: 'New Recipe',
    pluralTitle: null,
    titleIdentifier: 'new-recipe',
    instructionSubsections: [{ name: 'Instruct One', instructions: ['Instr #1.', 'Instr #2.'] }],
    ingredientSubsections: [
        {
            name: null,
            ingredients: [
                {
                    _id: mockRecipeIngredientIdSix,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '2',
                    unit: mockTeaspoon,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
            ],
        },
    ],
    tags: [mockFreezableTag],
    calculatedTags: [],
    numServings: 2,
    isIngredient: false,
    notes: 'Recipe Notes.',
    source: 'Recipe Source',
    images: [],
    owner: mockAdmin,
};
export const mockRecipeNewAsIngr = {
    ...mockRecipeNew,
    _id: mockRecipeIdNewAsIngr,
    isIngredient: true,
    title: 'New Ingredient Recipe',
    titleIdentifier: 'new-ingredient-recipe',
    pluralTitle: 'New Ingredient Recipes',
    tags: [],
    numServings: 1,
    notes: null,
    source: null,
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
export const mockGetRecipeFour = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'mock-recipe-four' } },
    },
    result: { data: { recipeOne: mockRecipeFour } },
};
export const mockGetRecipeNew = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'new-recipe' } },
    },
    result: { data: { recipeOne: { ...mockRecipeNew, images: [mockImageNew] } } },
};
export const mockGetRecipeNewAsIngr = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'new-ingredient-recipe' } },
    },
    result: { data: { recipeOne: mockRecipeNewAsIngr } },
};
// GetRecipes
export const mockGetRecipes = {
    request: {
        query: GET_RECIPES,
        variables: { offset: 0, limit: 25 },
    },
    result: {
        data: {
            recipeMany: [
                mockRecipeOne,
                mockRecipeTwo,
                mockRecipeThree,
                mockRecipeFour,
            ] satisfies GetRecipesQuery['recipeMany'] as GetRecipesQuery['recipeMany'],
        },
    },
};
export const mockCountRecipes = {
    request: {
        query: COUNT_RECIPES,
    },
    result: {
        data: {
            recipeCount: 4,
        },
    },
};
