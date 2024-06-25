import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { Recipe, RecipeIngredient } from '@recipe/graphql/generated';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { IngredientsTab } from '../IngredientsTab';

loadErrorMessages();
loadDevMessages();

const MockIngredientsTab = () => {
    const props = {
        recipeId: '60f4d2e5c3d5a0a4f1b9c0eb',
        ingredients: [
            {
                _id: '60f4d2e5c3d5afa4f1b9c0f8',
                quantity: '1',
                unit: mockGetUnits.result.data.unitMany[2], // kilogram
                ingredient: mockGetIngredients.result.data.ingredientMany[1], // chicken
                prepMethod: null,
                type: 'ingredient',
            },
        ] as RecipeIngredient[],
        notes: null as Recipe['notes'],
        numServings: 4,
        tags: [] as Recipe['tags'],
        calculatedTags: [] as Recipe['calculatedTags'],
    };
    return <IngredientsTab {...props} />;
};

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<MockIngredientsTab />} />)
);

const renderComponent = () => {
    // Multiple mocks of the same query are needed due to refetch calls
    render(
        <MockedProvider mocks={[mockGetUnits, mockGetUnitConversions, mockGetRatingsRecipeOne]}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('IngredientsTab unit conversion', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display the expected quantity and unit', async () => {
        // Render
        renderComponent();

        // Expect
        expect(screen.queryByText('1kg chicken')).not.toBeNull();
    });

    it('should not switch units when servings are increased', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const plusButton = screen.getByLabelText('Increase serving size');
        await user.click(plusButton);

        // Expect
        expect(screen.queryByText('1.25kg chicken')).not.toBeNull();
    });

    it('should switch to grams after lowering servings', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const minusButton = screen.getByLabelText('Decrease serving size');
        await user.click(minusButton);

        // Expect
        expect(screen.queryByText('750g chicken')).not.toBeNull();
    });
});
