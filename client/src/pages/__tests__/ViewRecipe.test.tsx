import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { ViewRecipe } from '../ViewRecipe';
import { mockGetRecipe } from '../__mocks__/GetRecipe';
import { mockGetRatings } from '../__mocks__/GetRatings';

loadErrorMessages();
loadDevMessages();

vi.mock('../../constants.ts');

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<ViewRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider mocks={[mockGetRecipe, mockGetRatings]}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('placeholder test', () => {
    afterEach(() => {
        cleanup();
    });
    it('should pass', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();
        await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());

        // Act
        const ingredientInput = screen.getByText('Ingredients');
        await user.click(ingredientInput);

        expect(true).toBe(true);
    });
});
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
