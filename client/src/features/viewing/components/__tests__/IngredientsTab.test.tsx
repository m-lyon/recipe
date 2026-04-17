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
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockChickenId, mockRecipeIngredientIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS } from '@recipe/graphql/queries/nutritionalInfo';

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
                                _id: mockRecipeIngredientIdOne,
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

describe('IngredientsTab nutritional info integration', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders the nutritional info panel with per-serving calories', async () => {
        // 1 kg chicken × 1.65 kcal/g = 1650 kcal; recipe has 4 servings → 412.5 → 413 kcal/serving
        const mockGetNutritionalInfos = {
            request: {
                query: GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
                variables: { ingredientIds: [mockChickenId] },
            },
            result: {
                data: {
                    __typename: 'Query',
                    nutritionalInfosByIngredientIds: [
                        {
                            __typename: 'NutritionalInfo',
                            _id: 'ni-chicken',
                            ingredient: mockChickenId,
                            usdaFdcId: null,
                            perGram: {
                                __typename: 'NutritionalInfoPerGram',
                                calories: 1.65,
                                protein: 0.31,
                                carbs: 0,
                                fat: 0.036,
                            },
                            perUnit: null,
                        },
                    ],
                } satisfies GetNutritionalInfosByIngredientIdsQuery,
            },
        };

        const MockIngredientsTab = () => {
            const props = {
                recipe: {
                    ...mockRecipeOne,
                    numServings: 4,
                    ingredientSubsections: [
                        {
                            __typename: 'IngredientSubsection',
                            name: null,
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

        const routes = createRoutesFromElements(
            <Route path='/' element={<MockIngredientsTab />} />
        );
        renderPage(routes, [
            mockGetIngredientComponents,
            mockGetUnitConversions,
            mockCurrentUserAdmin,
            mockGetNutritionalInfos,
        ]);

        expect(await screen.findByText('Nutritional Info (per serving)')).not.toBeNull();
        // 1000g × 1.65 kcal/g = 1650 total, ÷ 4 servings = 412.5 → rounded to 413
        expect(await screen.findByText('413 kcal')).not.toBeNull();
    });
});
