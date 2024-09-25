import { GetRecipeQueryVariables } from '@recipe/graphql/generated';
import { mockRecipeIngredientIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFour } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFive } from '@recipe/graphql/__mocks__/ids';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { mockRecipeIngredientIdEight } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdThree } from '@recipe/graphql/__mocks__/ids';
import { mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';
import { CountRecipesQuery, GetRecipeQuery } from '@recipe/graphql/generated';
import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdThree, mockRecipeIdTwo } from '@recipe/graphql/__mocks__/ids';
import { GetRecipesQuery, GetRecipesQueryVariables } from '@recipe/graphql/generated';
import { mockImageNew, mockImageTwo } from '@recipe/graphql/mutations/__mocks__/image';
import { COUNT_RECIPES, GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockRecipeIdFour, mockRecipeIngredientIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNewAsIngr, mockRecipeIngredientIdSix } from '@recipe/graphql/__mocks__/ids';
import { EnumRecipeIngredientType, GetIngredientComponentsQuery } from '@recipe/graphql/generated';

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
            units: mockUnits,
            sizes: mockSizes,
            ingredients: mockIngredients,
            recipes: mockRecipeFromIngredients,
            prepMethods: mockPrepMethods,
        } satisfies GetIngredientComponentsQuery,
    },
};

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
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit
                    _id: mockRecipeIngredientIdTwo,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1',
                    unit: null,
                    size: mockSmall,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit and plural quantity
                    _id: mockRecipeIngredientIdThree,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '2',
                    unit: null,
                    size: null,
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
                    size: mockMedium,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no prep method
                    _id: mockRecipeIngredientIdFive,
                    type: EnumRecipeIngredientType.Ingredient,
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
    numServings: 3,
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
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit
                    _id: mockRecipeIngredientIdTwo,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1',
                    unit: null,
                    size: mockSmall,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    // ingredient with no unit and plural quantity
                    _id: mockRecipeIngredientIdThree,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '2',
                    unit: null,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    _id: mockRecipeIngredientIdOne,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '1.13',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    _id: mockRecipeIngredientIdOne,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '5',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    _id: mockRecipeIngredientIdOne,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '26.1',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    _id: mockRecipeIngredientIdOne,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '101',
                    unit: mockOunce,
                    size: null,
                    ingredient: mockApple,
                    prepMethod: mockDiced,
                },
                {
                    _id: mockRecipeIngredientIdOne,
                    type: EnumRecipeIngredientType.Ingredient,
                    quantity: '251',
                    unit: mockOunce,
                    size: null,
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
                    size: null,
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
        variables: { filter: { titleIdentifier: undefined } } satisfies GetRecipeQueryVariables,
    },
    result: { data: { recipeOne: mockRecipeOne } satisfies GetRecipeQuery },
};
export const mockGetRecipeOne = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-one' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { recipeOne: mockRecipeOne } satisfies GetRecipeQuery },
};
export const mockGetRecipeTwo = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-two' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { recipeOne: mockRecipeTwo } satisfies GetRecipeQuery },
};
export const mockGetRecipeThree = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-three' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { recipeOne: mockRecipeThree } satisfies GetRecipeQuery },
};
export const mockGetRecipeFour = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-four' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { recipeOne: mockRecipeFour } satisfies GetRecipeQuery },
};
export const mockGetRecipeNew = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'new-recipe' } } satisfies GetRecipeQueryVariables,
    },
    result: {
        data: { recipeOne: { ...mockRecipeNew, images: [mockImageNew] } } satisfies GetRecipeQuery,
    },
};
export const mockGetRecipeNewAsIngr = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'new-ingredient-recipe' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { recipeOne: mockRecipeNewAsIngr } satisfies GetRecipeQuery },
};
// GetRecipes
export const mockGetRecipes = {
    request: {
        query: GET_RECIPES,
        variables: { offset: 0, limit: 5 } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
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
            recipeCount: 2,
        } satisfies CountRecipesQuery,
    },
};
