import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { mockKilogram } from '@recipe/graphql/queries/__mocks__/unit';
import { mockRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockChicken } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { IngredientsTab } from '../IngredientsTab';

loadErrorMessages();
loadDevMessages();

const renderComponent = () => {
    const MockIngredientsTab = () => {
        const props = {
            recipe: {
                ...mockRecipeOne,
                ingredientSubsections: [
                    {
                        __typename: 'IngredientSubsection',
                        name: 'Section One',
                        ingredients: [
                            {
                                _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                                __typename: 'RecipeIngredient',
                                quantity: '1',
                                unit: mockKilogram,
                                size: null,
                                ingredient: mockChicken,
                                prepMethod: null,
                            },
                        ],
                    },
                ],
            } satisfies CompletedRecipeView,
        };
        return <IngredientsTab {...props} />;
    };

    const routes = createRoutesFromElements(<Route path='/' element={<MockIngredientsTab />} />);
    return renderPage(routes, [
        mockGetIngredientComponents,
        mockGetUnitConversions,
        mockCurrentUserAdmin,
    ]);
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
