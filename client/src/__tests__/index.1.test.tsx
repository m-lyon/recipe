import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
// import { debug } from 'vitest-preview';

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
});
