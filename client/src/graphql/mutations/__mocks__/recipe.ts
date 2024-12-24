import { UpdateRecipeMutation } from '@recipe/graphql/generated';
import { mockSpicyTag } from '@recipe/graphql/queries/__mocks__/tag';
import { mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { mockApple } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockDiced } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { UpdateRecipeMutationVariables } from '@recipe/graphql/generated';
import { mockRecipeIngredientIdThree } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdSeven } from '@recipe/graphql/__mocks__/ids';
import { mockRatingNewTwo } from '@recipe/graphql/queries/__mocks__/rating';
import { GetRecipeQuery, RecipeIngredient } from '@recipe/graphql/generated';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeNew, mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { CREATE_RECIPE, DELETE_RECIPE, UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { mockRecipeFour, mockRecipeNewAsIngr } from '@recipe/graphql/queries/__mocks__/recipe';
import { DeleteRecipeMutation, DeleteRecipeMutationVariables } from '@recipe/graphql/generated';
import { CreateRecipeMutation, CreateRecipeMutationVariables } from '@recipe/graphql/generated';

import { mockCreateTag } from './tag';

const getMockRecipeVariables = (mockRecipe: CompletedRecipeView = mockRecipeOne) => {
    return {
        id: mockRecipe._id,
        recipe: {
            title: mockRecipe.title,
            pluralTitle: mockRecipe.pluralTitle ?? undefined,
            instructionSubsections: mockRecipe.instructionSubsections.map((subsect: any) => ({
                name: subsect.name ?? undefined,
                instructions: subsect.instructions,
            })),
            ingredientSubsections: mockRecipe.ingredientSubsections?.map((subsect: any) => ({
                name: subsect.name ?? undefined,
                ingredients: subsect.ingredients.map((ingr: RecipeIngredient) => ({
                    quantity: ingr.quantity,
                    unit: ingr.unit?._id,
                    size: ingr.size?._id,
                    ingredient: ingr.ingredient?._id,
                    prepMethod: ingr.prepMethod?._id,
                })),
            })),
            tags: mockRecipe.tags.map((tag: any) => tag._id),
            notes: mockRecipe.notes ?? undefined,
            source: mockRecipe.source ?? undefined,
            numServings: mockRecipe.numServings,
            isIngredient: mockRecipe.isIngredient,
        },
    };
};
interface UpdateReturn extends NonNullable<GetRecipeQuery['recipeOne']> {
    titleIdentifier: string;
}
const getMockRecipeReturn = (mockRecipe: UpdateReturn = mockRecipeOne) => {
    return { record: mockRecipe };
};

const recipeOneVars = getMockRecipeVariables();
const recipeOneData = getMockRecipeReturn();
export const mockUpdateRecipeOneNoChange = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: recipeOneData.record,
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeOneRatingAdded = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    ratings: [...recipeOneData.record.ratings, mockRatingNewTwo],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeNumServings = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, numServings: 5 },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeOneData.record, numServings: 5 },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeNewTitle = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, title: 'New Title' },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeOneData.record, title: 'New Title' },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeInstructionsEdit = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                instructionSubsections: [
                    { instructions: ['Instruction one.', 'New instruction!'] },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    instructionSubsections: [
                        {
                            __typename: 'InstructionSubsection',
                            name: null,
                            instructions: ['Instruction one.', 'New instruction!'],
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeInstructionsAdd = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                instructionSubsections: [
                    { instructions: ['Instruction one.', 'Instruction two.', 'New instruction.'] },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    instructionSubsections: [
                        {
                            __typename: 'InstructionSubsection',
                            name: null,
                            instructions: [
                                'Instruction one.',
                                'Instruction two.',
                                'New instruction.',
                            ],
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeInstructionsRemove = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                instructionSubsections: [{ instructions: ['Instruction one.'] }],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    instructionSubsections: [
                        {
                            __typename: 'InstructionSubsection',
                            name: null,
                            instructions: ['Instruction one.'],
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeAddExistingTag = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                tags: [...recipeOneVars.recipe.tags, mockSpicyTag._id],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    tags: [...recipeOneData.record.tags, mockSpicyTag],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeAddNote = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, notes: 'A new note.' },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeOneData.record, notes: 'A new note.' },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeAddSource = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, source: 'A new source' },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeOneData.record, source: 'A new source' },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeRemoveTag = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                tags: [recipeOneVars.recipe.tags[0]],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    tags: [recipeOneData.record.tags[0]],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeAddNewTag = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                tags: [
                    ...recipeOneVars.recipe.tags,
                    mockCreateTag.result.data.tagCreateOne.record._id,
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    tags: [
                        ...recipeOneData.record.tags,
                        mockCreateTag.result.data.tagCreateOne.record,
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeIngredientsAdd = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [
                    recipeOneVars.recipe.ingredientSubsections[0],
                    {
                        name: recipeOneVars.recipe.ingredientSubsections[1].name,
                        ingredients: [
                            ...recipeOneVars.recipe.ingredientSubsections[1].ingredients,
                            {
                                quantity: '4',
                                unit: mockTeaspoon._id,
                                ingredient: mockApple._id,
                                prepMethod: mockDiced._id,
                            },
                        ],
                    },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [
                        recipeOneData.record.ingredientSubsections[0],
                        {
                            __typename: 'IngredientSubsection',
                            name: recipeOneData.record.ingredientSubsections[1].name,
                            ingredients: [
                                ...recipeOneData.record.ingredientSubsections[1].ingredients,
                                {
                                    _id: mockRecipeIngredientIdSeven,
                                    __typename: 'RecipeIngredient',
                                    quantity: '4',
                                    unit: mockTeaspoon,
                                    size: null,
                                    ingredient: mockApple,
                                    prepMethod: mockDiced,
                                },
                            ],
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeIngredientsEdit = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [
                    {
                        name: recipeOneVars.recipe.ingredientSubsections[0].name,
                        ingredients: [
                            ...recipeOneVars.recipe.ingredientSubsections[0].ingredients.filter(
                                (ingr: RecipeIngredient) => ingr.quantity !== '2'
                            ),
                            {
                                quantity: '4',
                                unit: mockTeaspoon._id,
                                ingredient: mockApple._id,
                                prepMethod: mockDiced._id,
                            },
                        ],
                    },
                    recipeOneVars.recipe.ingredientSubsections[1],
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [
                        {
                            __typename: 'IngredientSubsection',
                            name: recipeOneData.record.ingredientSubsections[0].name,
                            ingredients: [
                                ...recipeOneData.record.ingredientSubsections[0].ingredients.filter(
                                    (ingr) => ingr!.quantity !== '2'
                                ),
                                {
                                    _id: mockRecipeIngredientIdThree,
                                    __typename: 'RecipeIngredient',
                                    quantity: '4',
                                    unit: mockTeaspoon,
                                    size: null,
                                    ingredient: mockApple,
                                    prepMethod: mockDiced,
                                },
                            ],
                        },
                        recipeOneData.record.ingredientSubsections[1],
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeIngredientsRemove = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [
                    {
                        name: recipeOneVars.recipe.ingredientSubsections[0].name,
                        ingredients: [
                            ...recipeOneVars.recipe.ingredientSubsections[0].ingredients.filter(
                                (ingr: RecipeIngredient) => ingr.quantity !== '2'
                            ),
                        ],
                    },
                    recipeOneVars.recipe.ingredientSubsections[1],
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [
                        {
                            __typename: 'IngredientSubsection',
                            name: recipeOneData.record.ingredientSubsections[0].name,
                            ingredients: [
                                ...recipeOneData.record.ingredientSubsections[0].ingredients.filter(
                                    (ingr) => ingr!.quantity !== '2'
                                ),
                            ],
                        },
                        recipeOneData.record.ingredientSubsections[1],
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeCalculatedTagsAdd = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    calculatedTags: ['vegan', 'vegetarian', 'special'],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeCalculatedTagsEdit = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeOneData.record, calculatedTags: ['vegetarian', 'special'] },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeCalculatedTagsRemove = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    calculatedTags: ['vegetarian'],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeAddIsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, isIngredient: true, pluralTitle: 'Mock Recipes' },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    isIngredient: true,
                    pluralTitle: 'Mock Recipes',
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeAddIngredientSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [
                    ...recipeOneVars.recipe.ingredientSubsections,
                    {
                        name: 'New Section',
                        ingredients: [
                            {
                                quantity: '5',
                                unit: mockTeaspoon._id,
                                ingredient: mockApple._id,
                                prepMethod: mockDiced._id,
                            },
                        ],
                    },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [
                        ...recipeOneData.record.ingredientSubsections,
                        {
                            __typename: 'IngredientSubsection',
                            name: 'New Section',
                            ingredients: [
                                {
                                    _id: mockRecipeIngredientIdSeven,
                                    __typename: 'RecipeIngredient',
                                    quantity: '5',
                                    unit: mockTeaspoon,
                                    size: null,
                                    ingredient: mockApple,
                                    prepMethod: mockDiced,
                                },
                            ],
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeEditIngredientSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [
                    {
                        name: recipeOneVars.recipe.ingredientSubsections[0].name,
                        ingredients: recipeOneVars.recipe.ingredientSubsections[0].ingredients,
                    },
                    {
                        name: 'Section Four',
                        ingredients: recipeOneVars.recipe.ingredientSubsections[1].ingredients,
                    },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [
                        {
                            __typename: 'IngredientSubsection',
                            name: recipeOneData.record.ingredientSubsections[0].name,
                            ingredients: recipeOneData.record.ingredientSubsections[0].ingredients,
                        },
                        {
                            __typename: 'IngredientSubsection',
                            name: 'Section Four',
                            ingredients: recipeOneData.record.ingredientSubsections[1].ingredients,
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeRemoveIngredientSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [recipeOneVars.recipe.ingredientSubsections[1]],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [recipeOneData.record.ingredientSubsections[1]],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
const recipeTwoVars = getMockRecipeVariables(mockRecipeTwo);
const recipeTwoData = getMockRecipeReturn(mockRecipeTwo);
export const mockUpdateRecipeTwo = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: recipeTwoVars.recipe,
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: recipeTwoData.record,
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeNewTitleAsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: { ...recipeTwoVars.recipe, title: 'New Title', pluralTitle: 'New Titles' },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeTwoData.record, title: 'New Title', pluralTitle: 'New Titles' },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeRemoveAsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: { ...recipeTwoVars.recipe, isIngredient: false, pluralTitle: undefined },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeTwoData.record, isIngredient: false, pluralTitle: null },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeEditAsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: {
                ...recipeTwoVars.recipe,
                ingredientSubsections: [
                    {
                        name: recipeTwoVars.recipe.ingredientSubsections[0].name,
                        ingredients: recipeTwoVars.recipe.ingredientSubsections[0].ingredients,
                    },
                    {
                        name: 'Section TwoTwo',
                        ingredients: [recipeTwoVars.recipe.ingredientSubsections[1].ingredients[0]],
                    },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeTwoData.record,
                    ingredientSubsections: [
                        {
                            __typename: 'IngredientSubsection',
                            name: recipeTwoData.record.ingredientSubsections[0].name,
                            ingredients: recipeTwoData.record.ingredientSubsections[0].ingredients,
                        },
                        {
                            __typename: 'IngredientSubsection',
                            name: 'Section TwoTwo',
                            ingredients: [
                                recipeTwoData.record.ingredientSubsections[1].ingredients[0],
                            ],
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateAddInstructionSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: {
                ...recipeTwoVars.recipe,
                instructionSubsections: [
                    ...recipeTwoVars.recipe.instructionSubsections,
                    { name: 'New Section', instructions: ['A new instruction.'] },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeTwoData.record,
                    instructionSubsections: [
                        ...recipeTwoData.record.instructionSubsections,
                        {
                            __typename: 'InstructionSubsection',
                            name: 'New Section',
                            instructions: ['A new instruction.'],
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateEditInstructionSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: {
                ...recipeTwoVars.recipe,
                instructionSubsections: [
                    { ...recipeTwoVars.recipe.instructionSubsections[0], name: 'Instruct Four' },
                ],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeTwoData.record,
                    instructionSubsections: [
                        {
                            ...recipeTwoData.record.instructionSubsections[0],
                            name: 'Instruct Four',
                        },
                    ],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
const recipeThreeVars = getMockRecipeVariables(mockRecipeThree);
const recipeThreeData = getMockRecipeReturn(mockRecipeThree);
export const mockUpdateRecipeRemoveNotes = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, notes: undefined },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeThreeData.record, notes: null },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeUpdateSource = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, source: 'Exa' },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeThreeData.record, source: 'Exa' },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeUpdateNotes = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, notes: 'A new note.' },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeThreeData.record, notes: 'A new note.' },
            },
        } satisfies UpdateRecipeMutation,
    },
};
export const mockUpdateRecipeRemoveSource = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, source: undefined },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: { ...recipeThreeData.record, source: null },
            },
        } satisfies UpdateRecipeMutation,
    },
};
const recipeFourVars = getMockRecipeVariables(mockRecipeFour);
const recipeFourData = getMockRecipeReturn(mockRecipeFour);
export const mockUpdateRemoveInstructionSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeFourVars.id,
            recipe: {
                ...recipeFourVars.recipe,
                instructionSubsections: [recipeFourVars.recipe.instructionSubsections[1]],
            },
        } satisfies UpdateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeUpdateById: {
                __typename: 'UpdateByIdRecipePayload',
                record: {
                    ...recipeFourData.record,
                    instructionSubsections: [recipeFourData.record.instructionSubsections[1]],
                },
            },
        } satisfies UpdateRecipeMutation,
    },
};
const mockCreateRecipeVars = getMockRecipeVariables(mockRecipeNew);
const mockCreateRecipeData = getMockRecipeReturn(mockRecipeNew);
export const mockCreateRecipe = {
    request: {
        query: CREATE_RECIPE,
        variables: { recipe: mockCreateRecipeVars.recipe } satisfies CreateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeCreateOne: {
                __typename: 'CreateOneRecipePayload',
                record: mockCreateRecipeData.record,
            },
        } satisfies CreateRecipeMutation,
    },
};
const mockCreateRecipeAsIngrVars = getMockRecipeVariables(mockRecipeNewAsIngr);
const mockCreateRecipeAsIngrData = getMockRecipeReturn(mockRecipeNewAsIngr);
export const mockCreateRecipeAsIngr = {
    request: {
        query: CREATE_RECIPE,
        variables: {
            recipe: mockCreateRecipeAsIngrVars.recipe,
        } satisfies CreateRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeCreateOne: {
                __typename: 'CreateOneRecipePayload',
                record: mockCreateRecipeAsIngrData.record,
            },
        } satisfies CreateRecipeMutation,
    },
};
export const mockDeleteRecipeOne = {
    request: {
        query: DELETE_RECIPE,
        variables: { id: recipeOneVars.id } satisfies DeleteRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeRemoveById: {
                __typename: 'RemoveByIdRecipeModifyPayload',
                recordId: recipeOneVars.id,
            },
        } satisfies DeleteRecipeMutation,
    },
};
export const mockDeleteRecipeTwo = {
    request: {
        query: DELETE_RECIPE,
        variables: { id: recipeTwoVars.id } satisfies DeleteRecipeMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            recipeRemoveById: {
                __typename: 'RemoveByIdRecipeModifyPayload',
                recordId: recipeTwoVars.id,
            },
        } satisfies DeleteRecipeMutation,
    },
};
