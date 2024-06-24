import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
// import { debug } from 'vitest-preview';

import { getCache } from '@recipe/utils/cache';
import { ROOT_PATH } from '@recipe/constants';
import { UserProvider } from '@recipe/features/user';
import { UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetRatings } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockCountRecipes, mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { GetRecipeQuery } from '@recipe/graphql/generated';

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
                mockGetRatings,
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
                pluralTitle: undefined,
                instructions: mockRecipe.instructions,
                ingredients: mockRecipe.ingredients.map((ingr: any) => ({
                    quantity: ingr.quantity,
                    unit: ingr.unit?._id,
                    ingredient: ingr.ingredient._id,
                    prepMethod: ingr.prepMethod?._id,
                    type: ingr.type,
                })),
                tags: mockRecipe.tags.map((tag: any) => tag._id),
                notes: undefined,
                source: undefined,
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
        await user.click(screen.getByLabelText('Recipe title'));
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
        renderComponent([mockUpdateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Two'));
        debug();
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Recipe title'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Mock '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Recipe '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Two'
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
});

// TODO: do an update title workflow when recipe is an ingredient

// describe('Delete Recipe Workflow', () => {
//     afterEach(() => {
//         cleanup();
//     });
// });
