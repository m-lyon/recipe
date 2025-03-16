import { GetRecipeQuery } from '@recipe/graphql/generated';
import { GetRecipeQueryVariables } from '@recipe/graphql/generated';
import { GetIngredientComponentsQuery } from '@recipe/graphql/generated';
import { GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockRecipeIngredientIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFour } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFive } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdNine } from '@recipe/graphql/__mocks__/ids';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { mockRecipeIngredientIdEight } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdThree } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdEleven } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdTwelve } from '@recipe/graphql/__mocks__/ids';
import { mockTitleOne, mockTitleTwo } from '@recipe/graphql/__mocks__/common';
import { mockRecipeIngredientIdThirteen } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdThree, mockRecipeIdTwo } from '@recipe/graphql/__mocks__/ids';
import { GetIngredientAndRecipeIngredientsQuery } from '@recipe/graphql/generated';
import { GetRecipesQuery, GetRecipesQueryVariables } from '@recipe/graphql/generated';
import { mockImageNew, mockImageTwo } from '@recipe/graphql/mutations/__mocks__/image';
import { GET_INGREDIENT_AND_RECIPE_INGREDIENTS } from '@recipe/graphql/queries/recipe';
import { mockRecipeIdFour, mockRecipeIngredientIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNewAsIngr, mockRecipeIngredientIdSix } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdFive, mockRecipeIngredientIdFourteen } from '@recipe/graphql/__mocks__/ids';
import { mockAdminId, mockRecipeIngredientIdTen, mockUserId } from '@recipe/graphql/__mocks__/ids';

import { mockDiced, mockPrepMethods } from './prepMethod';
import { mockMedium, mockSizes, mockSmall } from './size';
import { mockCup, mockOunce, mockTeaspoon, mockUnits } from './unit';
import { mockDinnerTag, mockFreezableTag, mockLunchTag } from './tag';
import { mockApple, mockIngredients, mockRecipeFromIngredients } from './ingredient';
import { mockRatingNewOne, mockRatingOne, mockRatingThree, mockRatingTwo } from './rating';

export const mockGetIngredientAndRecipeIngredients = {
    request: {
        query: GET_INGREDIENT_AND_RECIPE_INGREDIENTS,
    },
    result: {
        data: {
            __typename: 'Query',
            ingredients: mockIngredients,
            recipes: mockRecipeFromIngredients,
        } satisfies GetIngredientAndRecipeIngredientsQuery,
    },
};

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

export const mockRecipeOne: CompletedRecipeView = {
    __typename: 'Recipe',
    _id: mockRecipeIdOne,
    title: mockTitleOne,
    pluralTitle: null,
    titleIdentifier: 'mock-recipe-one',
    instructionSubsections: [
        {
            __typename: 'InstructionSubsection',
            name: null,
            instructions: ['Instruction one.', 'Instruction two.'],
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
    ratings: [mockRatingOne],
    source: null,
    owner: mockAdminId,
};
export const mockRecipeTwo: CompletedRecipeView = {
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
            instructions: ['Instruction one.', 'Instruction two.'],
        },
    ],
    pluralTitle: 'Mock Recipes Two',
    images: [mockImageTwo],
    ratings: [mockRatingTwo],
    calculatedTags: [],
    numServings: 3,
    owner: mockUserId,
};
export const mockRecipeThree: CompletedRecipeView = {
    ...mockRecipeOne,
    _id: mockRecipeIdThree,
    title: 'Mock Recipe Three',
    titleIdentifier: 'mock-recipe-three',
    tags: [],
    source: 'Example',
    notes: 'Notes.',
    calculatedTags: [],
    ratings: [mockRatingThree],
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
export const mockRecipeFour: CompletedRecipeView = {
    ...mockRecipeOne,
    _id: mockRecipeIdFour,
    title: 'Mock Recipe Four',
    titleIdentifier: 'mock-recipe-four',
    tags: [],
    calculatedTags: [],
    ratings: [],
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
export const mockRecipeFive: CompletedRecipeView = {
    ...mockRecipeOne,
    _id: mockRecipeIdFive,
    title: 'Mock Recipe Five',
    titleIdentifier: 'mock-recipe-five',
    tags: [],
    ratings: [],
    calculatedTags: [],
    instructionSubsections: [
        {
            __typename: 'InstructionSubsection',
            name: 'Instruc One',
            instructions: ['Instr #3.', 'Instr #4.'],
        },
    ],
    ingredientSubsections: [
        {
            __typename: 'IngredientSubsection',
            name: '1st Section',
            ingredients: [
                {
                    _id: mockRecipeIngredientIdFourteen,
                    __typename: 'RecipeIngredient',
                    quantity: '1',
                    unit: mockTeaspoon,
                    size: null,
                    ingredient: mockRecipeFour,
                    prepMethod: null,
                },
            ],
        },
    ],
};
export const mockRecipeNew: CompletedRecipeView = {
    _id: mockRecipeIdNew,
    __typename: 'Recipe',
    title: 'New Recipe',
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
    ratings: [],
    owner: mockAdminId,
};
export const mockRecipeNewAsIngr: CompletedRecipeView = {
    ...mockRecipeNew,
    _id: mockRecipeIdNewAsIngr,
    isIngredient: true,
    title: 'New Ingredient Recipe',
    titleIdentifier: 'new-ingredient-recipe',
    pluralTitle: 'New Ingredient Recipes',
    tags: [],
    ratings: [],
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
export const mockGetRecipeTwoById = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { _id: mockRecipeIdTwo },
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
export const mockGetRecipeFourById = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { _id: mockRecipeIdFour },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { __typename: 'Query', recipeOne: mockRecipeFour } satisfies GetRecipeQuery },
};
export const mockGetRecipeFive = {
    request: {
        query: GET_RECIPE,
        variables: {
            filter: { titleIdentifier: 'mock-recipe-five' },
        } satisfies GetRecipeQueryVariables,
    },
    result: { data: { __typename: 'Query', recipeOne: mockRecipeFive } satisfies GetRecipeQuery },
};
export const mockGetRecipeNew = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'new-recipe' } } satisfies GetRecipeQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeOne: { ...mockRecipeNew, images: [] },
        } satisfies GetRecipeQuery,
    },
};
export const mockGetRecipeNewWithImages = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: 'new-recipe' } } satisfies GetRecipeQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeOne: { ...mockRecipeNew, images: [mockImageNew], ratings: [mockRatingNewOne] },
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
            recipeCount: 4,
        } satisfies GetRecipesQuery,
    },
};
export const mockGetRecipesExtra = {
    request: mockGetRecipes.request,
    result: {
        data: {
            __typename: 'Query',
            recipeMany: mockGetRecipes.result.data.recipeMany.concat([mockRecipeFive]),
            recipeCount: 5,
        } satisfies GetRecipesQuery,
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
            recipeCount: 15,
        } satisfies GetRecipesQuery,
    },
};
export const mockGetRecipesLargerFilteredOnePageOne = {
    request: {
        query: GET_RECIPES,
        variables: {
            offset: 0,
            limit: 5,
            filter: { _operators: { title: { regex: '/one/i' } } },
            countFilter: { _operators: { title: { regex: '/one/i' } } },
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
            recipeCount: 9,
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
            countFilter: { _operators: { title: { regex: '/one/i' } } },
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
            recipeCount: 9,
        } satisfies GetRecipesQuery,
    },
};
export const mockGetRecipesFilteredTwo = {
    request: {
        query: GET_RECIPES,
        variables: {
            offset: 0,
            limit: 5,
            filter: { _operators: { title: { regex: '/two/i' } } },
            countFilter: { _operators: { title: { regex: '/two/i' } } },
        } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeMany: [{ ...mockRecipeTwo, _id: 'mock-recipe-two' }],
            recipeCount: 1,
        } satisfies GetRecipesQuery,
    },
};
export const mockGetRecipesLargerFilteredTwo = {
    request: {
        query: GET_RECIPES,
        variables: {
            offset: 0,
            limit: 5,
            filter: { _operators: { title: { regex: '/two/i' } } },
            countFilter: { _operators: { title: { regex: '/two/i' } } },
        } satisfies GetRecipesQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            recipeMany: [
                { ...mockRecipeTwo, _id: 'mock-recipe-two' },
                { ...mockRecipeTwo, _id: 'mock-recipe-five' },
            ],
            recipeCount: 2,
        } satisfies GetRecipesQuery,
    },
};
