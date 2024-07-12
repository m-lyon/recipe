import { mockSpicyTag } from '@recipe/graphql/queries/__mocks__/tag';
import { mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { mockApple } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockDiced } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockRecipeNewAsIngr } from '@recipe/graphql/queries/__mocks__/recipe';
import { EnumRecipeIngredientType, GetRecipeQuery } from '@recipe/graphql/generated';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeNew, mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { CREATE_RECIPE, DELETE_RECIPE, UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';

import { mockCreateTag } from './tag';

const getMockRecipeVariables = (
    mockRecipe: NonNullable<GetRecipeQuery['recipeOne']> = mockRecipeOne
) => {
    return {
        id: mockRecipe._id,
        recipe: {
            title: mockRecipe.title,
            pluralTitle: mockRecipe.pluralTitle ?? null,
            instructions: mockRecipe.instructions,
            ingredients: mockRecipe.ingredients.map((ingr: any) => ({
                quantity: ingr.quantity,
                unit: ingr.unit?._id,
                ingredient: ingr.ingredient._id,
                prepMethod: ingr.prepMethod?._id,
                type: ingr.type,
            })),
            tags: mockRecipe.tags.map((tag: any) => tag._id),
            notes: mockRecipe.notes ?? null,
            source: mockRecipe.source ?? null,
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
export const mockUpdateRecipeOne = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: recipeOneData.record },
        },
    },
};
export const mockUpdateRecipeNumServings = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, numServings: 5 },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeOneData.record, numServings: 5 } },
        },
    },
};
export const mockUpdateRecipeNewTitle = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, title: 'New Title' },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: { ...recipeOneData.record, title: 'New Title' },
            },
        },
    },
};
export const mockUpdateRecipeInstructionsEdit = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                instructions: ['Instruction one', 'New instruction.'],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    instructions: ['Instruction one', 'New instruction.'],
                },
            },
        },
    },
};
export const mockUpdateRecipeInstructionsAdd = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                instructions: ['Instruction one', 'Instruction two.', 'New instruction.'],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    instructions: ['Instruction one', 'Instruction two.', 'New instruction.'],
                },
            },
        },
    },
};
export const mockUpdateRecipeInstructionsRemove = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                instructions: ['Instruction one'],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    instructions: ['Instruction one'],
                },
            },
        },
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
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    tags: [...recipeOneData.record.tags, mockSpicyTag],
                },
            },
        },
    },
};
export const mockUpdateRecipeAddNote = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, notes: 'A new note.' },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeOneData.record, notes: 'A new note.' } },
        },
    },
};
export const mockUpdateRecipeAddSource = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, source: 'A new source' },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeOneData.record, source: 'A new source' } },
        },
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
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    tags: [recipeOneData.record.tags[0]],
                },
            },
        },
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
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    tags: [
                        ...recipeOneData.record.tags,
                        mockCreateTag.result.data.tagCreateOne.record,
                    ],
                },
            },
        },
    },
};
export const mockUpdateRecipeIngredientsAdd = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredients: [
                    ...recipeOneVars.recipe.ingredients,
                    {
                        quantity: '4',
                        unit: mockTeaspoon._id,
                        ingredient: mockApple._id,
                        prepMethod: mockDiced._id,
                        type: 'ingredient' as EnumRecipeIngredientType,
                    },
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    ingredients: [
                        ...recipeOneData.record.ingredients,
                        {
                            quantity: '4',
                            unit: mockTeaspoon,
                            ingredient: mockApple,
                            prepMethod: mockDiced,
                            type: 'ingredient' as EnumRecipeIngredientType,
                        },
                    ],
                },
            },
        },
    },
};
export const mockUpdateRecipeIngredientsEdit = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredients: [
                    ...recipeOneVars.recipe.ingredients.filter((ingr) => ingr.quantity !== '2'),
                    {
                        quantity: '4',
                        unit: mockTeaspoon._id,
                        ingredient: mockApple._id,
                        prepMethod: mockDiced._id,
                        type: 'ingredient' as EnumRecipeIngredientType,
                    },
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    ingredients: [
                        ...recipeOneData.record.ingredients.filter(
                            (ingr) => ingr?.quantity !== '2'
                        ),
                        {
                            quantity: '4',
                            unit: mockTeaspoon,
                            ingredient: mockApple,
                            prepMethod: mockDiced,
                            type: 'ingredient' as EnumRecipeIngredientType,
                        },
                    ],
                },
            },
        },
    },
};
export const mockUpdateRecipeIngredientsRemove = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredients: recipeOneVars.recipe.ingredients.filter(
                    (ingr) => ingr.quantity !== '2'
                ),
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    ingredients: recipeOneData.record.ingredients.filter(
                        (ingr) => ingr?.quantity !== '2'
                    ),
                },
            },
        },
    },
};
export const mockUpdateRecipeCalculatedTagsAdd = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    calculatedTags: ['vegan', 'vegetarian', 'special'],
                },
            },
        },
    },
};
export const mockUpdateRecipeCalculatedTagsEdit = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: { ...recipeOneData.record, calculatedTags: ['vegetarian', 'special'] },
            },
        },
    },
};
export const mockUpdateRecipeCalculatedTagsRemove = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    calculatedTags: ['vegetarian'],
                },
            },
        },
    },
};
export const mockUpdateRecipeAddIsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: { ...recipeOneVars.recipe, isIngredient: true, pluralTitle: 'Mock Recipes' },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    isIngredient: true,
                    pluralTitle: 'Mock Recipes',
                },
            },
        },
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
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: recipeTwoData.record },
        },
    },
};
export const mockUpdateRecipeNewTitleAsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: { ...recipeTwoVars.recipe, title: 'New Title', pluralTitle: 'New Titles' },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: { ...recipeTwoData.record, title: 'New Title', pluralTitle: 'New Titles' },
            },
        },
    },
};
export const mockUpdateRecipeRemoveAsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: { ...recipeTwoVars.recipe, isIngredient: false, pluralTitle: null },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: { ...recipeTwoData.record, isIngredient: false, pluralTitle: null },
            },
        },
    },
};
const recipeThreeVars = getMockRecipeVariables(mockRecipeThree);
const recipeThreeData = getMockRecipeReturn(mockRecipeThree);
export const mockUpdateRecipeRemoveNotes = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, notes: null },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeThreeData.record, notes: null } },
        },
    },
};
export const mockUpdateRecipeUpdateSource = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, source: 'Exa' },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeThreeData.record, source: 'Exa' } },
        },
    },
};
export const mockUpdateRecipeUpdateNotes = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, notes: 'A new note.' },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeThreeData.record, notes: 'A new note.' } },
        },
    },
};
export const mockUpdateRecipeRemoveSource = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeThreeVars.id,
            recipe: { ...recipeThreeVars.recipe, source: null },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeThreeData.record, source: null } },
        },
    },
};
const mockCreateRecipeVars = getMockRecipeVariables(mockRecipeNew);
const mockCreateRecipeData = getMockRecipeReturn(mockRecipeNew);
export const mockCreateRecipe = {
    request: {
        query: CREATE_RECIPE,
        variables: { recipe: mockCreateRecipeVars.recipe },
    },
    result: {
        data: {
            recipeCreateOne: { record: mockCreateRecipeData.record },
        },
    },
};
const mockCreateRecipeAsIngrVars = getMockRecipeVariables(mockRecipeNewAsIngr);
const mockCreateRecipeAsIngrData = getMockRecipeReturn(mockRecipeNewAsIngr);
export const mockCreateRecipeAsIngr = {
    request: {
        query: CREATE_RECIPE,
        variables: { recipe: mockCreateRecipeAsIngrVars.recipe },
    },
    result: {
        data: {
            recipeCreateOne: { record: mockCreateRecipeAsIngrData.record },
        },
    },
};
export const mockDeleteRecipe = {
    request: {
        query: DELETE_RECIPE,
        variables: { id: recipeOneVars.id },
    },
    result: {
        data: {
            recipeRemoveById: { recordId: recipeOneVars.id },
        },
    },
};
