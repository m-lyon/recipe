import { MockedResponse } from '@apollo/client/testing';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { GetRecipeNutritionQuery } from '@recipe/graphql/generated';
import { mockRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeIngredientIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockRecipeIngredientIdSixteen } from '@recipe/graphql/__mocks__/ids';
import { GET_RECIPE_NUTRITION } from '@recipe/graphql/queries/nutritionalInfo';
import { mockGram, mockKilogram } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetDisplayLadders } from '@recipe/graphql/queries/__mocks__/displayLadder';
import { mockChicken, mockRhurbarbPie } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockChickenId, mockRecipeIngredientIdFifteen } from '@recipe/graphql/__mocks__/ids';

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
        mockGetDisplayLadders,
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

/** The API's answer for one recipe: these lines, with the total their macros add up to. */
type NutritionLines = NonNullable<GetRecipeNutritionQuery['recipeById']>['nutrition']['lines'];

function nutritionMock(lines: NutritionLines, ingredientIds: string[]): MockedResponse {
    const total = lines.reduce(
        (sum, line) => ({
            ...sum,
            calories: sum.calories + line.macros.calories,
            protein: sum.protein + line.macros.protein,
            carbs: sum.carbs + line.macros.carbs,
            fat: sum.fat + line.macros.fat,
        }),
        { __typename: 'Macros' as const, calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
        request: {
            query: GET_RECIPE_NUTRITION,
            variables: { recipeId: mockRecipeOne._id, ingredientIds },
        },
        result: {
            data: {
                __typename: 'Query',
                recipeById: {
                    __typename: 'Recipe',
                    _id: mockRecipeOne._id,
                    nutrition: { __typename: 'RecipeNutrition', total, lines },
                },
                ingredientByIds: [],
            } satisfies GetRecipeNutritionQuery,
        },
    };
}

const macros = (calories: number, protein = 0, carbs = 0, fat = 0) => ({
    __typename: 'Macros' as const,
    calories,
    protein,
    carbs,
    fat,
});

/** 1 kg chicken at 1.65 kcal/g: 1650 kcal, 413 kcal per serving of 4. */
const chickenLine = {
    __typename: 'LineNutrition' as const,
    recipeIngredient: mockRecipeIngredientIdFifteen,
    status: 'COUNTED' as const,
    macros: macros(1650, 310, 0, 36),
    reason: null,
    childUncounted: null,
    childRecipe: null,
};

const chickenRecipeLine = {
    _id: mockRecipeIngredientIdFifteen,
    __typename: 'RecipeIngredient' as const,
    quantity: '1',
    unit: mockKilogram,
    size: null,
    ingredient: mockChicken,
    prepMethod: null,
};

/** 200 g of rhubarb pie, a recipe used as an ingredient. */
const pieRecipeLine = {
    _id: mockRecipeIngredientIdSixteen,
    __typename: 'RecipeIngredient' as const,
    quantity: '200',
    unit: mockGram,
    size: null,
    ingredient: { ...mockRhurbarbPie, titleIdentifier: 'rhubarb-pie-abcde' },
    prepMethod: null,
};

function renderTab(
    lines: (typeof chickenRecipeLine | typeof pieRecipeLine)[],
    mocks: MockedResponse[]
) {
    const MockIngredientsTab = () => {
        const props = {
            recipe: {
                ...mockRecipeOne,
                numServings: 4,
                ingredientSubsections: [
                    { __typename: 'IngredientSubsection', name: null, ingredients: lines },
                ],
            } satisfies CompletedRecipeView,
        };
        return <IngredientsTab {...props} />;
    };
    const routes = createRoutesFromElements(<Route path='/' element={<MockIngredientsTab />} />);
    return renderPage(routes, [
        mockGetIngredientComponents,
        mockGetDisplayLadders,
        mockCurrentUserAdmin,
        ...mocks,
    ]);
}

describe('IngredientsTab nutritional info integration', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders the nutritional info panel with per-serving calories', async () => {
        renderTab([chickenRecipeLine], [nutritionMock([chickenLine], [mockChickenId])]);

        expect(await screen.findByText('Nutritional Info (per serving)')).not.toBeNull();
        // 1650 kcal ÷ 4 servings = 412.5 → 413
        expect(await screen.findByText('413')).not.toBeNull();
    });

    it('keeps per-serving macros fixed when the servings control is moved', async () => {
        const user = userEvent.setup();
        renderTab([chickenRecipeLine], [nutritionMock([chickenLine], [mockChickenId])]);
        expect(await screen.findByText('413')).not.toBeNull();

        // Act -- the ingredient quantities scale with the control, so the per-serving
        // figure must not move: 5 servings of 1.25 kg is still 413 kcal per serving.
        await user.click(screen.getByLabelText('Increase serving size'));

        // Expect
        expect(await screen.findByText('1.25kg chicken')).not.toBeNull();
        expect(screen.queryByText('413')).not.toBeNull();
    });

    it('counts a recipe used as an ingredient, and links to it when it is partly counted', async () => {
        const pieLine = {
            __typename: 'LineNutrition' as const,
            recipeIngredient: mockRecipeIngredientIdSixteen,
            status: 'PARTIAL' as const,
            macros: macros(350),
            reason: {
                __typename: 'UncountedReason' as const,
                code: 'CHILD_PARTIAL' as const,
                message: '1 of 6 ingredients in rhubarb pie not counted',
            },
            childUncounted: 1,
            childRecipe: mockRhurbarbPie._id,
        };
        renderTab(
            [chickenRecipeLine, pieRecipeLine],
            [nutritionMock([chickenLine, pieLine], [mockChickenId])]
        );

        // (1650 + 350) ÷ 4 = 500
        expect(await screen.findByText('500')).not.toBeNull();
        expect(screen.getByText(/1 partly counted/)).not.toBeNull();
        expect(screen.queryByText(/not counted:/i)).toBeNull();
        expect(screen.getByText(/1 of 6 ingredients in rhubarb pie not counted/)).not.toBeNull();
        expect(
            screen.getByRole('link', { name: 'View its nutrition' }).getAttribute('href')
        ).toMatch(/\/view\/recipe\/rhubarb-pie-abcde$/);
    });

    it('offers to add a yield when a used recipe has none', async () => {
        const pieLine = {
            __typename: 'LineNutrition' as const,
            recipeIngredient: mockRecipeIngredientIdSixteen,
            status: 'UNCOUNTED' as const,
            macros: macros(0),
            reason: {
                __typename: 'UncountedReason' as const,
                code: 'NO_YIELD' as const,
                message: 'No yield recorded for rhubarb pie',
            },
            childUncounted: null,
            childRecipe: mockRhurbarbPie._id,
        };
        renderTab(
            [chickenRecipeLine, pieRecipeLine],
            [nutritionMock([chickenLine, pieLine], [mockChickenId])]
        );

        expect(await screen.findByText(/not counted: 1 ingredient$/i)).not.toBeNull();
        expect(screen.getByText(/no yield recorded for rhubarb pie/)).not.toBeNull();
        expect(screen.getByRole('link', { name: 'Add a yield' }).getAttribute('href')).toMatch(
            /\/edit\/recipe\/rhubarb-pie-abcde$/
        );
    });

    it('shows the empty state when nothing is counted', async () => {
        const pieLine = {
            __typename: 'LineNutrition' as const,
            recipeIngredient: mockRecipeIngredientIdSixteen,
            status: 'UNCOUNTED' as const,
            macros: macros(0),
            reason: {
                __typename: 'UncountedReason' as const,
                code: 'NO_YIELD' as const,
                message: 'No yield recorded for rhubarb pie',
            },
            childUncounted: null,
            childRecipe: mockRhurbarbPie._id,
        };
        renderTab([pieRecipeLine], [nutritionMock([pieLine], [])]);

        // The panel must not render a 0 kcal total.
        expect(await screen.findByText(/not available/i)).not.toBeNull();
        expect(screen.queryByText('Calories')).toBeNull();
    });
});
