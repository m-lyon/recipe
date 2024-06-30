import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';

import { ROOT_PATH } from '@recipe/constants';
import { getCache } from '@recipe/utils/cache';
import { UserProvider } from '@recipe/features/user';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCreateTag } from '@recipe/graphql/mutations/__mocks__/tag';
import { mockGetCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeTwo } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeThree } from '@recipe/graphql/queries/__mocks__/rating';
import { mockUpdateRecipeRemoveTag } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeAddNewTag } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeAddExistingTag } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockCountRecipes, mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeUpdateIngredients } from '@recipe/graphql/mutations/__mocks__/recipe';

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
                mockGetRecipeOne,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockCountRecipes,
                mockGetRatingsRecipeOne,
                mockGetRatingsRecipeTwo,
                mockGetRatingsRecipeThree,
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

describe('Update Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update the ingredients', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateIngredients]);
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
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
    });

    it('should remove a tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveTag]);
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
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
    });

    it('should add a new tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddNewTag, mockCreateTag]);
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
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
    });

    it('should add an existing tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddExistingTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        await user.click(await screen.findByText('spicy'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('spicy')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('spicy')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('spicy')).not.toBeNull();
    });
});
