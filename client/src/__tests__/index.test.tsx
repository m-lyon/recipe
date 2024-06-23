import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
// import { debug } from 'vitest-preview';

import { cache } from '@recipe/utils/cache';
import { ROOT_PATH } from '@recipe/constants';
import { UserProvider } from '@recipe/features/user';
import { UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetRatings } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetRecipes, mockRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
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
                mockGetRatings,
                ...mockedResponses,
            ]}
            cache={cache}
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
    const mockUpdateRecipeVariables = {
        id: mockRecipeOne._id,
        recipe: {
            title: mockRecipeOne.title,
            pluralTitle: undefined,
            instructions: mockRecipeOne.instructions,
            ingredients: mockRecipeOne.ingredients.map((ingr) => ({
                quantity: ingr.quantity,
                unit: ingr.unit?._id,
                ingredient: ingr.ingredient._id,
                prepMethod: ingr.prepMethod?._id,
                type: ingr.type,
            })),
            tags: mockRecipeOne.tags.map((tag) => tag._id),
            notes: undefined,
            source: undefined,
            numServings: 4,
            isIngredient: mockRecipeOne.isIngredient,
        },
    };
    const mockUpdateRecord = {
        record: {
            __typename: 'Recipe',
            _id: mockRecipeOne._id,
            titleIdentifier: mockRecipeOne.titleIdentifier,
            title: mockRecipeOne.title,
            tags: mockRecipeOne.tags,
            calculatedTags: mockRecipeOne.calculatedTags,
            numServings: 4,
            isIngredient: mockRecipeOne.isIngredient,
            pluralTitle: mockRecipeOne.pluralTitle,
            images: mockRecipeOne.images,
        },
    };

    afterEach(() => {
        cleanup();
    });

    it('should navigate to the edit recipe page', async () => {
        // Render -----------------------------------------------
        renderComponent();

        // Act --------------------------------------------------
        const recipe = await screen.findByLabelText('View Mock Recipe');
        await userEvent.hover(recipe);
        await userEvent.click(screen.getByLabelText('Edit Mock Recipe'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Instruction one')).not.toBeNull();
    });

    it('should update the servings', async () => {
        // Render -----------------------------------------------
        const mockUpdateRecipe = {
            request: {
                query: UPDATE_RECIPE,
                variables: {
                    id: mockUpdateRecipeVariables.id,
                    recipe: { ...mockUpdateRecipeVariables.recipe, numServings: 5 },
                },
            },
            result: {
                data: {
                    recipeUpdateById: { record: { ...mockUpdateRecord.record, numServings: 5 } },
                },
            },
        };
        renderComponent([mockUpdateRecipe]);

        // Act --------------------------------------------------
        await userEvent.hover(await screen.findByLabelText('View Mock Recipe'));
        await userEvent.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await userEvent.click(screen.getByLabelText('Increase serving size'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await userEvent.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await userEvent.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await userEvent.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await userEvent.hover(await screen.findByLabelText('View Mock Recipe'));
        await userEvent.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
    });
});

// describe('Delete Recipe Workflow', () => {
//     afterEach(() => {
//         cleanup();
//     });
// });
