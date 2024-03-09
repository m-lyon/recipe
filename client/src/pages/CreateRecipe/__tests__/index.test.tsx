import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MockedProvider } from '@apollo/client/testing';
import { CreateRecipe } from '..';
import { mockGetUnits } from '../components/EditableIngredientList/__mocks__/GetUnits';
import { mockGetIngredients } from '../components/EditableIngredientList/__mocks__/GetIngredients';
import { mockGetPrepMethods } from '../components/EditableIngredientList/__mocks__/GetPrepMethods';
import { mockGetTags } from '../components/__mocks__/GetTags';
import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

jest.mock('../../../constants.ts');

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<CreateRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider
            mocks={[mockGetUnits, mockGetIngredients, mockGetPrepMethods, mockGetTags]}
            addTypename={false}
        >
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

        // Act
        const ingredientInput = screen.getByText('Ingredients');
        await user.click(ingredientInput);

        expect(true).toBe(true);
    });
});
