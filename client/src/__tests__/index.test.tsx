import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { debug } from 'vitest-preview';

import { ROOT_PATH } from '@recipe/constants';
import { getCache } from '@recipe/utils/cache';
import { UserProvider } from '@recipe/features/user';
import { UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockCreateTag } from '@recipe/graphql/mutations/__mocks__/tag';
import { mockGetCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeTwo } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetUnits, mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { EnumRecipeIngredientType, GetRecipeQuery } from '@recipe/graphql/generated';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockDiced, mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockApple, mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockCountRecipes, mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';

loadErrorMessages();
loadDevMessages();

const renderComponent = (
    mockedResponses: MockedResponse<Record<string, any>, Record<string, any>>[] = []
) => {
    render(
        <MockedProvider
            mocks={[
                mockGetCurrentUser,
                mockGetUnits,
                mockGetIngredients,
                mockGetPrepMethods,
                mockGetTags,
                mockGetUnitConversions,
                mockGetRecipes,
                mockGetRecipeOne,
                mockCountRecipes,
                mockGetRatingsRecipeOne,
                ...mockedResponses,
            ]}
            cache={getCache()}
        >
            <ChakraProvider>
                <UserProvider>
                    <RouterProvider
                        router={createMemoryRouter(routes, {
                            initialEntries: [ROOT_PATH],
                        })}
                    />
                </UserProvider>
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('Home Page', () => {
    afterEach(() => {
        cleanup();
    });
    it('should load the home page', async () => {
        // Render -----------------------------------------------
        renderComponent();

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
    });
});

describe('View Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to the view recipe page', async () => {
        // Render -----------------------------------------------
        renderComponent();

        // Act --------------------------------------------------
        const recipe = await screen.findByLabelText('View Mock Recipe');
        await userEvent.click(recipe);

        // Expect ------------------------------------------------
        expect(await screen.findByText('Instruction one')).not.toBeNull();
    });
});

describe('Update Recipe Workflow', () => {
    const getMockUpdateRecipeVariables = (
        mockRecipe: NonNullable<GetRecipeQuery['recipeOne']> = mockRecipeOne
    ) => {
        return {
            id: mockRecipe._id,
            recipe: {
                title: mockRecipe.title,
                pluralTitle: mockRecipe.pluralTitle ?? undefined,
                instructions: mockRecipe.instructions,
                ingredients: mockRecipe.ingredients.map((ingr: any) => ({
                    quantity: ingr.quantity,
                    unit: ingr.unit?._id,
                    ingredient: ingr.ingredient._id,
                    prepMethod: ingr.prepMethod?._id,
                    type: ingr.type,
                })),
                tags: mockRecipe.tags.map((tag: any) => tag._id),
                notes: mockRecipe.notes ?? undefined,
                source: mockRecipe.source ?? undefined,
                numServings: 4,
                isIngredient: mockRecipe.isIngredient,
            },
        };
    };
    interface UpdateReturn extends NonNullable<GetRecipeQuery['recipeOne']> {
        titleIdentifier: string;
    }
    const getMockUpdateReturn = (mockRecipe: UpdateReturn = mockRecipeOne) => {
        return {
            record: {
                __typename: 'Recipe',
                _id: mockRecipe._id,
                titleIdentifier: mockRecipe.titleIdentifier,
                title: mockRecipe.title,
                tags: mockRecipe.tags,
                calculatedTags: mockRecipe.calculatedTags,
                numServings: 4,
                isIngredient: mockRecipe.isIngredient,
                pluralTitle: mockRecipe.pluralTitle,
                images: mockRecipe.images,
            },
        };
    };

    afterEach(() => {
        cleanup();
    });

    it('should navigate to the edit recipe page', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        const recipe = await screen.findByLabelText('View Mock Recipe');
        await user.hover(recipe);
        await user.click(screen.getByLabelText('Edit Mock Recipe'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Instruction one')).not.toBeNull();
    });

    it('should update the servings', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: { ...vars.recipe, numServings: 5 },
                },
            },
            result: {
                data: {
                    recipeUpdateById: { record: { ...data.record, numServings: 5 } },
                },
            },
        };
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Increase serving size'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
    });

    it('should update the title', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: { ...vars.recipe, title: 'New Title' },
                },
            },
            result: {
                data: {
                    recipeUpdateById: {
                        record: { ...data.record, title: 'New Title' },
                    },
                },
            },
        };
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe title'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Mock '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Recipe '
        await user.keyboard('New Title');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View New Title'));
        await user.click(screen.getByLabelText('Edit New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
    });

    it('should update the title when recipe is an ingredient', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables(mockRecipeTwo);
        const data = getMockUpdateReturn(mockRecipeTwo);
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: { ...vars.recipe, title: 'New Title' },
                },
            },
            result: {
                data: {
                    recipeUpdateById: {
                        record: { ...data.record, title: 'New Title' },
                    },
                },
            },
        };
        renderComponent([mockUpdateRecipe, mockGetRecipeTwo, mockGetRatingsRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Two'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe title'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Mock '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Recipe '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Two'
        await user.keyboard('New Title');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        // wait for 500ms for the page to load
        await new Promise((resolve) => setTimeout(resolve, 500));
        debug();
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View New Title'));
        await user.click(screen.getByLabelText('Edit New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
    });

    it('should update the instructions', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: {
                        ...vars.recipe,
                        instructions: ['Instruction one', 'New instruction.'],
                    },
                },
            },
            result: {
                data: {
                    recipeUpdateById: {
                        record: {
                            ...data.record,
                            instructions: ['Instruction one', 'New instruction.'],
                        },
                    },
                },
            },
        };
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit instruction 2'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Inst'
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'ruct'
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'ion '
        await user.keyboard('{Backspace}{Backspace}{Backspace}'); // remove 'Two'
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        // wait 500ms
        await new Promise((resolve) => setTimeout(resolve, 500));
        debug();
        expect(await screen.findByText('New Instruction.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('New Instruction.')).not.toBeNull();
    });

    it('should update the notes', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: { ...vars.recipe, notes: 'A new note.' },
                },
            },
            result: {
                data: {
                    recipeUpdateById: { record: { ...data.record, notes: 'A new note.' } },
                },
            },
        };
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('A new note{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        // wait 500ms
        await new Promise((resolve) => setTimeout(resolve, 500));
        debug();
        expect(await screen.findByText('A new note.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
    });

    it('should update the source', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: { ...vars.recipe, source: 'A new source' },
                },
            },
            result: {
                data: {
                    recipeUpdateById: { record: { ...data.record, source: 'A new source' } },
                },
            },
        };
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('A new source');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('A new source')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('A new source')).not.toBeNull();
    });

    it('should update the ingredients', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const updatedIngredients = vars.recipe.ingredients.filter((ingr) => ingr.quantity !== '2');
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: {
                        ...vars.recipe,
                        ingredients: [
                            ...updatedIngredients,
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
                            ...data.record,
                            ingredients: [
                                ...updatedIngredients,
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
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Remove 2 apples, diced'));
        await user.click(screen.getByLabelText('Enter ingredient'));
        await user.keyboard('{4}{ }');
        await user.click(await screen.findByText('teaspoons'));
        await user.click(await screen.findByText('apples'));
        await user.click(await screen.findByText('diced'));
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        // wait 500ms
        await new Promise((resolve) => setTimeout(resolve, 500));
        debug();
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
    });

    it('should update the tags by removing one', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: {
                        ...vars.recipe,
                        tags: [vars.recipe.tags[0]],
                    },
                },
            },
            result: {
                data: {
                    recipeUpdateById: {
                        record: {
                            ...data.record,
                            tags: [data.record.tags[0]],
                        },
                    },
                },
            },
        };
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Remove lunch tag'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.getByText('lunch')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.getByText('lunch')).toBeNull();
    });

    it('should update the tags by adding one', async () => {
        // Render -----------------------------------------------
        const vars = getMockUpdateRecipeVariables();
        const data = getMockUpdateReturn();
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: vars.id,
                    recipe: {
                        ...vars.recipe,
                        tags: [
                            ...vars.recipe.tags,
                            mockCreateTag.result.data.tagCreateOne.record._id,
                        ],
                    },
                },
            },
            result: {
                data: {
                    recipeUpdateById: {
                        record: {
                            ...data.record,
                            tags: [
                                ...data.record.tags,
                                mockCreateTag.result.data.tagCreateOne.record,
                            ],
                        },
                    },
                },
            },
        };
        renderComponent([mockUpdateRecipe, mockCreateTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('mock tag{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.getByText('mock tag')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.getByText('mock tag')).not.toBeNull();
    });

    // TODO: add image, remove image
});

// describe('Delete Recipe Workflow', () => {
//     afterEach(() => {
//         cleanup();
//     });
// });
