import { EnumRecipeIngredientType } from '@recipe/graphql/generated';
import { mockSpicyTag } from '@recipe/graphql/queries/__mocks__/tag';
import { mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { mockApple } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockDiced } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockRecipeIngredientIdThree } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdSeven } from '@recipe/graphql/__mocks__/ids';
import { GetRecipeQuery, RecipeIngredient } from '@recipe/graphql/generated';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeNew, mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { CREATE_RECIPE, DELETE_RECIPE, UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { mockRecipeFour, mockRecipeNewAsIngr } from '@recipe/graphql/queries/__mocks__/recipe';

import { mockCreateTag } from './tag';

const getMockRecipeVariables = (
    mockRecipe: NonNullable<GetRecipeQuery['recipeOne']> = mockRecipeOne
) => {
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
                    ingredient: ingr.ingredient?._id,
                    prepMethod: ingr.prepMethod?._id,
                    type: ingr.type,
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
                instructionSubsections: [{ instructions: ['Instruction one', 'New instruction.'] }],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    instructionSubsections: [
                        { name: null, instructions: ['Instruction one', 'New instruction.'] },
                    ],
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
                instructionSubsections: [
                    { instructions: ['Instruction one', 'Instruction two.', 'New instruction.'] },
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    instructionSubsections: [
                        {
                            name: null,
                            instructions: [
                                'Instruction one',
                                'Instruction two.',
                                'New instruction.',
                            ],
                        },
                    ],
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
                instructionSubsections: [{ instructions: ['Instruction one'] }],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    instructionSubsections: [{ name: null, instructions: ['Instruction one'] }],
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
                ingredientSubsections: [
                    recipeOneVars.recipe.ingredientSubsections![0],
                    {
                        name: recipeOneVars.recipe.ingredientSubsections![1].name,
                        ingredients: [
                            ...recipeOneVars.recipe.ingredientSubsections![1].ingredients,
                            {
                                quantity: '4',
                                unit: mockTeaspoon._id,
                                ingredient: mockApple._id,
                                prepMethod: mockDiced._id,
                                type: EnumRecipeIngredientType.Ingredient,
                            },
                        ],
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
                    ingredientSubsections: [
                        recipeOneData.record.ingredientSubsections![0],
                        {
                            name: recipeOneData.record.ingredientSubsections![1]!.name,
                            ingredients: [
                                ...recipeOneData.record.ingredientSubsections![1]!.ingredients,
                                {
                                    _id: mockRecipeIngredientIdSeven,
                                    quantity: '4',
                                    unit: mockTeaspoon,
                                    ingredient: mockApple,
                                    prepMethod: mockDiced,
                                    type: EnumRecipeIngredientType.Ingredient,
                                },
                            ],
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
                ingredientSubsections: [
                    {
                        name: recipeOneVars.recipe.ingredientSubsections![0].name,
                        ingredients: [
                            ...recipeOneVars.recipe.ingredientSubsections![0].ingredients.filter(
                                (ingr: RecipeIngredient) => ingr.quantity !== '2'
                            ),
                            {
                                quantity: '4',
                                unit: mockTeaspoon._id,
                                ingredient: mockApple._id,
                                prepMethod: mockDiced._id,
                                type: EnumRecipeIngredientType.Ingredient,
                            },
                        ],
                    },
                    recipeOneVars.recipe.ingredientSubsections![1],
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [
                        {
                            name: recipeOneData.record.ingredientSubsections![0]!.name,
                            ingredients: [
                                ...recipeOneData.record.ingredientSubsections![0]!.ingredients.filter(
                                    (ingr) => ingr!.quantity !== '2'
                                ),
                                {
                                    _id: mockRecipeIngredientIdThree,
                                    quantity: '4',
                                    unit: mockTeaspoon,
                                    ingredient: mockApple,
                                    prepMethod: mockDiced,
                                    type: EnumRecipeIngredientType.Ingredient,
                                },
                            ],
                        },
                        recipeOneData.record.ingredientSubsections![1],
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
                ingredientSubsections: [
                    {
                        name: recipeOneVars.recipe.ingredientSubsections![0].name,
                        ingredients: [
                            ...recipeOneVars.recipe.ingredientSubsections![0].ingredients.filter(
                                (ingr: RecipeIngredient) => ingr.quantity !== '2'
                            ),
                        ],
                    },
                    recipeOneVars.recipe.ingredientSubsections![1],
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [
                        {
                            name: recipeOneData.record.ingredientSubsections![0]!.name,
                            ingredients: [
                                ...recipeOneData.record.ingredientSubsections![0]!.ingredients.filter(
                                    (ingr) => ingr!.quantity !== '2'
                                ),
                            ],
                        },
                        recipeOneData.record.ingredientSubsections![1],
                    ],
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
export const mockUpdateRecipeAddIngredientSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [
                    ...recipeOneVars.recipe.ingredientSubsections!,
                    {
                        name: 'New Section',
                        ingredients: [
                            {
                                quantity: '5',
                                unit: mockTeaspoon._id,
                                ingredient: mockApple._id,
                                prepMethod: mockDiced._id,
                                type: EnumRecipeIngredientType.Ingredient,
                            },
                        ],
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
                    ingredientSubsections: [
                        ...recipeOneData.record.ingredientSubsections!,
                        {
                            name: 'New Section',
                            ingredients: [
                                {
                                    _id: mockRecipeIngredientIdSeven,
                                    quantity: '5',
                                    unit: mockTeaspoon,
                                    ingredient: mockApple,
                                    prepMethod: mockDiced,
                                    type: EnumRecipeIngredientType.Ingredient,
                                },
                            ],
                        },
                    ],
                },
            },
        },
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
                        name: recipeOneVars.recipe.ingredientSubsections![0].name,
                        ingredients: recipeOneVars.recipe.ingredientSubsections![0].ingredients,
                    },
                    {
                        name: 'Section Four',
                        ingredients: recipeOneVars.recipe.ingredientSubsections![1].ingredients,
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
                    ingredientSubsections: [
                        {
                            name: recipeOneData.record.ingredientSubsections![0]!.name,
                            ingredients:
                                recipeOneData.record.ingredientSubsections![0]!.ingredients,
                        },
                        {
                            name: 'Section Four',
                            ingredients:
                                recipeOneData.record.ingredientSubsections![1]!.ingredients,
                        },
                    ],
                },
            },
        },
    },
};
export const mockUpdateRecipeRemoveIngredientSubsection = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeOneVars.id,
            recipe: {
                ...recipeOneVars.recipe,
                ingredientSubsections: [recipeOneVars.recipe.ingredientSubsections![0]],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeOneData.record,
                    ingredientSubsections: [recipeOneData.record.ingredientSubsections![0]],
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
            recipe: { ...recipeTwoVars.recipe, isIngredient: false, pluralTitle: undefined },
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
export const mockUpdateRecipeEditAsIngredient = {
    request: {
        query: UPDATE_RECIPE,
        variables: {
            id: recipeTwoVars.id,
            recipe: {
                ...recipeTwoVars.recipe,
                ingredientSubsections: [
                    {
                        name: recipeTwoVars.recipe.ingredientSubsections![0].name,
                        ingredients: recipeTwoVars.recipe.ingredientSubsections![0].ingredients,
                    },
                    {
                        name: 'Section TwoTwo',
                        ingredients: [
                            recipeTwoVars.recipe.ingredientSubsections![1].ingredients[0],
                        ],
                    },
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeTwoData.record,
                    ingredientSubsections: [
                        {
                            name: recipeTwoData.record.ingredientSubsections![0]!.name,
                            ingredients:
                                recipeTwoData.record.ingredientSubsections![0]!.ingredients,
                        },
                        {
                            name: 'Section TwoTwo',
                            ingredients: [
                                recipeTwoData.record.ingredientSubsections![1]!.ingredients[0],
                            ],
                        },
                    ],
                },
            },
        },
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
                    ...recipeTwoVars.recipe.instructionSubsections!,
                    { name: 'New Section', instructions: ['A new instruction.'] },
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeTwoData.record,
                    instructionSubsections: [
                        ...recipeTwoData.record.instructionSubsections!,
                        { name: 'New Section', instructions: ['A new instruction.'] },
                    ],
                },
            },
        },
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
                    { ...recipeTwoVars.recipe.instructionSubsections![0], name: 'Instruct Four' },
                ],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeTwoData.record,
                    instructionSubsections: [
                        {
                            ...recipeTwoData.record.instructionSubsections![0],
                            name: 'Instruct Four',
                        },
                    ],
                },
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
            recipe: { ...recipeThreeVars.recipe, notes: undefined },
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
            recipe: { ...recipeThreeVars.recipe, source: undefined },
        },
    },
    result: {
        data: {
            recipeUpdateById: { record: { ...recipeThreeData.record, source: null } },
        },
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
                instructionSubsections: [recipeFourVars.recipe.instructionSubsections![0]],
            },
        },
    },
    result: {
        data: {
            recipeUpdateById: {
                record: {
                    ...recipeFourData.record,
                    instructionSubsections: [recipeFourData.record.instructionSubsections![0]],
                },
            },
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
export const mockDeleteRecipeOne = {
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
export const mockDeleteRecipeTwo = {
    request: {
        query: DELETE_RECIPE,
        variables: { id: recipeTwoVars.id },
    },
    result: {
        data: {
            recipeRemoveById: { recordId: recipeTwoVars.id },
        },
    },
};
