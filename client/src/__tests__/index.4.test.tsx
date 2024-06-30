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
import { mockGetCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeTwo } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeThree } from '@recipe/graphql/queries/__mocks__/rating';
import { mockUpdateRecipeAddSource } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveSource } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeUpdateSource } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
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

    it('should add a source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddSource]);
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
        expect(await screen.findByText('Source: A new source')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByDisplayValue('A new source')).not.toBeNull();
    });

    it('should remove a source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', 'Example');
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.keyboard('{Backspace}{Backspace}{Backspace}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(screen.queryByText('Source:')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', '');
    });

    it('should update the source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(screen.queryByText('Source: Exa')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(screen.queryByDisplayValue('Exa')).not.toBeNull();
    });
});
