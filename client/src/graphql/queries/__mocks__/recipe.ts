import { GetIngredientComponentsQuery } from '@recipe/graphql/generated';
import { mockRecipeIngredientIdTen } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFour } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFive } from '@recipe/graphql/__mocks__/ids';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { mockRecipeIngredientIdNine } from '@recipe/graphql/__mocks__/ids';
import { GetRecipeQueryVariables, Recipe } from '@recipe/graphql/generated';
import { mockRecipeIngredientIdEight } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdThree } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdEleven } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdTwelve } from '@recipe/graphql/__mocks__/ids';
import { mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';
import { CountRecipesQuery, GetRecipeQuery } from '@recipe/graphql/generated';
import { mockRecipeIngredientIdThirteen } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdThree, mockRecipeIdTwo } from '@recipe/graphql/__mocks__/ids';
import { GetRecipesQuery, GetRecipesQueryVariables } from '@recipe/graphql/generated';
import { mockImageNew, mockImageTwo } from '@recipe/graphql/mutations/__mocks__/image';
import { COUNT_RECIPES, GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockRecipeIdFour, mockRecipeIngredientIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNewAsIngr, mockRecipeIngredientIdSix } from '@recipe/graphql/__mocks__/ids';

import { mockAdmin } from './user';
import { mockDiced, mockPrepMethods } from './prepMethod';
import { mockMedium, mockSizes, mockSmall } from './size';
import { mockCup, mockOunce, mockTeaspoon, mockUnits } from './unit';
import { mockDinnerTag, mockFreezableTag, mockLunchTag } from './tag';
import { mockApple, mockIngredients, mockRecipeFromIngredients } from './ingredient';

export const mockGetIngredientComponents = {
    request: {
        query: GET_INGREDIENT_COMPONENTS,
    },
    result: {
        data: {
            __typename: 'Query',
            units: mockUnits,
            sizes: mockSizes,
            ingredients: mockIngredients,
            recipes: mockRecipeFromIngredients,
            prepMethods: mockPrepMethods,
        } satisfies GetIngredientComponentsQuery,
    },
};

export const mockRecipeOne: Recipe = {
    __typename: 'Recipe',
    _id: mockRecipeIdOne,
    title: mockTitleOne,
    subTitle: null,
    pluralTitle: null,
    titleIdentifier: 'mock-recipe-one',
    instructionSubsections: [
        {
            __typename: 'InstructionSubsection',
            name: null,
            instructions: ['Instruction one', 'Instruction two'],
        },
    ],
    ingredientSubsections: [
        {
            __typename: 'IngredientSubsection',
            name: 'Section One',
            ingredients: [
                {
                    // normal ingrediens
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdOne,
                    quantity: '1',
                    unit: mockTeaspoon,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdTwo,
                    quantity: '1',
                    unit: null,
                    size: mockSmall,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit and plural quantity
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdThree,
                    quantity: '2',
                    unit: null,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
            ],
        },
        {
            __typename: 'IngredientSubsection',
            name: 'Section Two',
            ingredients: [
                {
                    // ingredient with fraction quantity
                    _id: mockRecipeIngredientIdFour,
                    __typename: 'RecipeIngredient',
                    quantity: '1/3',
                    unit: mockCup,
                    size: mockMedium,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no prep method
                    _id: mockRecipeIngredientIdFive,
                    __typename: 'RecipeIngredient',
                    quantity: '1',
                    unit: mockOunce,
                    size: null,
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
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    lastModified: new Date('2021-01-01T00:00:00.000Z'),
};
export const mockRecipeTwo: Recipe = {
    ...mockRecipeOne,
    _id: mockRecipeIdTwo,
    title: mockTitleTwo,
    tags: [],
    titleIdentifier: 'mock-recipe-two',
    isIngredient: true,
    instructionSubsections: [
        {
            __typename: 'InstructionSubsection',
            name: 'Instruct One',
            instructions: ['Instruction one', 'Instruction two'],
        },
    ],
    pluralTitle: 'Mock Recipes Two',
    images: [mockImageTwo],
    calculatedTags: [],
    numServings: 3,
};
export const mockRecipeThree: Recipe = {
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
            __typename: 'IngredientSubsection',
            name: null,
            ingredients: [
                {
                    // normal ingredient
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdOne,
                    quantity: '1',
                    unit: mockTeaspoon,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdTwo,
                    quantity: '1',
                    unit: null,
                    size: mockSmall,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit and plural quantity
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdThree,
                    quantity: '2',
                    unit: null,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdNine,
                    quantity: '1.13',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: null,
                },
                {
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdTen,
                    quantity: '5',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: null,
                },
                {
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdEleven,
                    quantity: '26.1',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: null,
                },
                {
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdTwelve,
                    quantity: '101',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: null,
                },
                {
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdThirteen,
                    quantity: '251',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: null,
                },
            ],
        },
    ],
};
export const mockRecipeFour: Recipe = {
    ...mockRecipeOne,
    _id: mockRecipeIdFour,
    title: 'Mock Recipe Four',
    titleIdentifier: 'mock-recipe-four',
    tags: [],
    calculatedTags: [],
    instructionSubsections: [
        {
            __typename: 'InstructionSubsection',
            name: 'Instruct One',
            instructions: ['Instr #1.', 'Instr #2.'],
        },
        { __typename: 'InstructionSubsection', name: 'Instruct Two', instructions: ['Instr #3.'] },
    ],
    ingredientSubsections: [
        {
            __typename: 'IngredientSubsection',
            name: 'First Section',
            ingredients: [
                {
                    _id: mockRecipeIngredientIdEight,
                    __typename: 'RecipeIngredient',
                    quantity: '1',
                    unit: mockTeaspoon,
                    size: null,
                    ingredient: mockRecipeTwo,
                    prepMethod: null,
                },
            ],
        },
    ],
};
export const mockRecipeNew: Recipe = {
    _id: mockRecipeIdNew,
    __typename: 'Recipe',
    title: 'New Recipe',
    subTitle: null,
    pluralTitle: null,
    titleIdentifier: 'new-recipe',
    instructionSubsections: [
        {
            __typename: 'InstructionSubsection',
            name: 'Instruct One',
            instructions: ['Instr #1.', 'Instr #2.'],
        },
    ],
    ingredientSubsections: [
        {
            __typename: 'IngredientSubsection',
            name: null,
            ingredients: [
                {
                    __typename: 'RecipeIngredient',
                    _id: mockRecipeIngredientIdSix,
                    quantity: '2',
                    unit: mockTeaspoon,
                    size: null,
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
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    lastModified: new Date('2021-01-01T00:00:00.000Z'),
};
export const mockRecipeNewAsIngr: Recipe = {
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
        variables: { filter: { titleIdentifier: undefined } } satisfies GetRecipeQueryVariables,
    },
    result: { data: { __typename: 'Query', recipeOne: mockRecipeOne } satisfies GetRecipeQuery },
};
export const mockGetRecipeOne = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-one' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { __typename: 'Query', recipeOne: mockRecipeOne } satisfies GetRecipeQuery },
};
export const mockGetRecipeTwo = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-two' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { __typename: 'Query', recipeOne: mockRecipeTwo } satisfies GetRecipeQuery },
};
export const mockGetRecipeThree = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-three' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { __typename: 'Query', recipeOne: mockRecipeThree } satisfies GetRecipeQuery },
};
export const mockGetRecipeFour = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-four' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { __typename: 'Query', recipeOne: mockRecipeFour } satisfies GetRecipeQuery },
};
export const mockGetRecipeNew = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'new-recipe' } } satisfies GetRecipeQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeOne: { ...mockRecipeNew, images: [mockImageNew] },
        } satisfies GetRecipeQuery,
    },
};
export const mockGetRecipeNewAsIngr = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'new-ingredient-recipe' },
        } satisfies GetRecipeQueryVariables,
    },
    result: {
        data: { __typename: 'Query', recipeOne: mockRecipeNewAsIngr } satisfies GetRecipeQuery,
    },
};
// GetRecipes
export const mockGetRecipes = {
    request: {
        query: GET_RECIPES,
        variables: { offset: 0, limit: 5 } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeMany: [mockRecipeOne, mockRecipeTwo, mockRecipeThree, mockRecipeFour],
        } satisfies GetRecipesQuery,
    },
};
export const mockCountRecipes = {
    request: {
        query: COUNT_RECIPES,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeCount: 4,
        } satisfies CountRecipesQuery,
    },
};
export const mockGetRecipesLarger = {
    request: {
        query: GET_RECIPES,
        variables: { offset: 0, limit: 5 } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeMany: [
                { ...mockRecipeOne, _id: 'mock-recipe-one' },
                { ...mockRecipeTwo, _id: 'mock-recipe-two' },
                { ...mockRecipeThree, _id: 'mock-recipe-three' },
                { ...mockRecipeOne, _id: 'mock-recipe-four' },
                { ...mockRecipeTwo, _id: 'mock-recipe-five' },
            ],
        } satisfies GetRecipesQuery,
    },
};
export const mockCountRecipesLarger = {
    request: {
        query: COUNT_RECIPES,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeCount: 15,
        } satisfies CountRecipesQuery,
    },
};
export const mockGetRecipesLargerFilteredOnePageOne = {
    request: {
        query: GET_RECIPES,
        variables: {
            offset: 0,
            limit: 5,
            filter: { _operators: { title: { regex: '/one/i' } } },
        } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeMany: [
                { ...mockRecipeOne, _id: 'mock-recipe-one' },
                { ...mockRecipeOne, _id: 'mock-recipe-four' },
                { ...mockRecipeOne, _id: 'mock-recipe-six' },
                { ...mockRecipeOne, _id: 'mock-recipe-seven' },
                { ...mockRecipeOne, _id: 'mock-recipe-eight' },
            ],
        } satisfies GetRecipesQuery,
    },
};
export const mockGetRecipesLargerFilteredOnePageTwo = {
    request: {
        query: GET_RECIPES,
        variables: {
            offset: 5,
            limit: 5,
            filter: { _operators: { title: { regex: '/one/i' } } },
        } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeMany: [
                { ...mockRecipeOne, _id: 'mock-recipe-nine' },
                { ...mockRecipeOne, _id: 'mock-recipe-ten' },
                { ...mockRecipeOne, _id: 'mock-recipe-eleven' },
                { ...mockRecipeOne, _id: 'mock-recipe-twelve' },
            ],
        } satisfies GetRecipesQuery,
    },
};
export const mockCountRecipesLargerFilteredOne = {
    request: {
        query: COUNT_RECIPES,
        variables: {
            filter: { _operators: { title: { regex: '/one/i' } } },
        } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeCount: 9,
        } satisfies CountRecipesQuery,
    },
};
export const mockGetRecipesLargerFilteredTwo = {
    request: {
        query: GET_RECIPES,
        variables: {
            offset: 0,
            limit: 5,
            filter: { _operators: { title: { regex: '/two/i' } } },
        } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeMany: [
                { ...mockRecipeTwo, _id: 'mock-recipe-two' },
                { ...mockRecipeTwo, _id: 'mock-recipe-five' },
            ],
        } satisfies GetRecipesQuery,
    },
};
export const mockCountRecipesLargerFilteredTwo = {
    request: {
        query: COUNT_RECIPES,
        variables: {
            filter: { _operators: { title: { regex: '/two/i' } } },
        } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeCount: 2,
        } satisfies CountRecipesQuery,
    },
};
