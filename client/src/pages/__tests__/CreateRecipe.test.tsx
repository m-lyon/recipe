import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { CreateRecipe } from '../CreateRecipe';

loadErrorMessages();
loadDevMessages();

vi.mock('../../constants.ts');

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<CreateRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider
            mocks={[
                mockGetUnits,
                mockGetIngredients,
                mockGetPrepMethods,
                mockGetTags,
                mockGetUnitConversions,
            ]}
        >
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
        const element = screen.getByPlaceholderText('Enter notes...');
        await user.click(element);
        await user.click(screen.getByText('Ingredients'));
        await user.click(element);
        await user.keyboard('g');

        // Expect
        expect(screen.queryByText('gEnter notes...')).toBeNull();
        expect(screen.queryByText('g')).not.toBeNull();
    });
});

// describe('Create Recipe', () => {
//     afterEach(() => {
//         cleanup();
//     });
//     it('should create a recipe', async () => {
//         // Render
//         const user = userEvent.setup();
//         renderComponent();

//         // Act
//         // Title
//         await user.click(screen.getByText('Enter Recipe Title'));
//         await user.keyboard('Recipe Title');
//         // Ingredient
//         await user.click(screen.getByText('Enter ingredient'));
//         await user.keyboard('{1}{ }');
//         await user.click(screen.getByText('gram'));
//         await user.click(screen.getByText('chicken'));
//         await user.click(screen.getByText('diced'));
//         // Instructions
//         await user.click(screen.getByText('Enter instructions...'));
//         await user.keyboard('Instructions Number One');
//         // Submit
//         await user.click(screen.getByText('Submit'));

//         // Expect
//     });
// });
