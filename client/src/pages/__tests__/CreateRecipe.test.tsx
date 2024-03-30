import { expect, describe, vi, it, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import { render, screen, cleanup } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

import { CreateRecipe } from '../CreateRecipe';
import { mockGetTags } from '../../features/editing/components/__mocks__/GetTags';
import { mockGetUnits } from '../../features/editing/components/EditableIngredientList/__mocks__/GetUnits';
import { mockGetIngredients } from '../../features/editing/components/EditableIngredientList/__mocks__/GetIngredients';
import { mockGetPrepMethods } from '../../features/editing/components/EditableIngredientList/__mocks__/GetPrepMethods';

import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';

loadErrorMessages();
loadDevMessages();

vi.mock('../../constants.ts');

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<CreateRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider mocks={[mockGetUnits, mockGetIngredients, mockGetPrepMethods, mockGetTags]}>
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

        // Act
        const ingredientInput = screen.getByText('Ingredients');
        await user.click(ingredientInput);

        expect(true).toBe(true);
    });
});

describe('Title', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset', async () => {
        // Render

        const user = userEvent.setup();
        renderComponent();

        // Act
        const element = screen.getByText('Enter Recipe Title');
        await user.click(element);
        await user.click(screen.getByText('Ingredients'));
        await user.click(element);
        await user.keyboard('g');

        // Expect
        expect(screen.queryByText('gEnter Recipe Title')).toBeNull();
        expect(screen.queryByText('g')).not.toBeNull();
    });
});

describe('Notes', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        const element = screen.getByText('Enter Notes...');
        await user.click(element);
        await user.click(screen.getByText('Ingredients'));
        await user.click(element);
        await user.keyboard('g');

        // Expect
        expect(screen.queryByText('gEnter Notes...')).toBeNull();
        expect(screen.queryByText('g')).not.toBeNull();
    });
});
