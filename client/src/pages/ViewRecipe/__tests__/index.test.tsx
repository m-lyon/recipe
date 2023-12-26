import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MockedProvider } from '@apollo/client/testing';
import { ViewRecipe } from '..';
import { mockGetRecipe } from '../__mocks__/GetRecipe';
import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<ViewRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider mocks={[mockGetRecipe]} addTypename={false}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('placeholder test', () => {
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
    it('should not display skipped prep methods', async () => {
        // Render
        renderComponent();
        await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
        expect(screen.getByText('1 oz apples')).toBeInTheDocument();
    });
});
