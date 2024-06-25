import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { mockGetRecipe } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { ViewRecipe } from '../ViewRecipe';

loadErrorMessages();
loadDevMessages();

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<ViewRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider mocks={[mockGetRecipe, mockGetRatingsRecipeOne, mockGetUnitConversions]}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('IngredientList', () => {
    afterEach(() => {
        cleanup();
    });
    it('should not display skipped prep methods', async () => {
        // Render
        renderComponent();
        await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
        // Expect
        expect(screen.queryByText('1 oz apples')).not.toBeNull();
    });
});
