import { mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { mockApple } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockDiced } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { CREATE_RECIPE, UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { EnumRecipeIngredientType, GetRecipeQuery } from '@recipe/graphql/generated';
import { mockFreezableTag, mockSpicyTag } from '@recipe/graphql/queries/__mocks__/tag';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';

import { mockCreateTag } from './tag';

const getMockUpdateRecipeVariables = (
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
            numServings: 4,
            isIngredient: mockRecipe.isIngredient,
        },
    };
};
interface UpdateReturn extends NonNullable<GetRecipeQuery['recipeOne']> {
    titleIdentifier: string;
}
const getMockUpdateReturn = (mockRecipe: UpdateReturn = mockRecipeOne) => {
    return { record: mockRecipe };
};

const recipeOneVars = getMockUpdateRecipeVariables();
const recipeOneData = getMockUpdateReturn();
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
export const mockUpdateRecipeInstructions = {
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
export const mockUpdateRecipeUpdateIngredients = {
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
export const mockUpdateRecipeCalculatedTags = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: recipeOneVars.recipe,
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeOneData.record, calculatedTags: ['special'] } },
        },
    },
};
const recipeTwoVars = getMockUpdateRecipeVariables(mockRecipeTwo);
const recipeTwoData = getMockUpdateReturn(mockRecipeTwo);
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
const recipeThreeVars = getMockUpdateRecipeVariables(mockRecipeThree);
const recipeThreeData = getMockUpdateReturn(mockRecipeThree);
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

export const mockCreateRecipe = {
    request: {
        query: CREATE_RECIPE,
        variables: {
            recipe: {
                title: 'New Recipe',
                pluralTitle: null,
                instructions: ['Instr #1.', 'Instr #2.'],
                ingredients: [
                    {
                        quantity: '2',
                        unit: mockTeaspoon._id,
                        ingredient: mockApple._id,
                        prepMethod: mockDiced._id,
                        type: 'ingredient',
                    },
                ],
                tags: [mockFreezableTag._id],
                numServings: 2,
                isIngredient: false,
                notes: 'Recipe Notes.',
                source: 'Recipe Source',
            },
        },
    },
    result: {
        data: {
            recipeCreateOne: {
                record: {
                    _id: '60f4d4e5c3d5a0a4f1b9c0ec',
                    title: 'New Recipe',
                    pluralTitle: null,
                    instructions: ['Instr #1.', 'Instr #2.'],
                    ingredients: [
                        {
                            quantity: '2',
                            unit: mockTeaspoon,
                            ingredient: mockApple,
                            prepMethod: mockDiced,
                            type: 'ingredient',
                        },
                    ],
                    tags: [mockFreezableTag],
                    calculatedTags: [],
                    numServings: 2,
                    isIngredient: false,
                    notes: 'Recipe Notes.',
                    source: 'Recipe Source',
                    images: [],
                },
            },
        },
    },
};
