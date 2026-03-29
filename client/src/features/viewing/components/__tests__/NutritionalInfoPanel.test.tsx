import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { mockChicken, mockApple } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGram, mockKilogram } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockChickenId, mockAppleId } from '@recipe/graphql/__mocks__/ids';
import { GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS } from '@recipe/graphql/queries/nutritionalInfo';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';

import { NutritionalInfoPanel } from '../NutritionalInfoPanel';

loadErrorMessages();
loadDevMessages();

// Mock NutritionalInfo data for chicken (per gram) and apple (per unit)
const mockNutritionalInfoChicken = {
    __typename: 'NutritionalInfo' as const,
    _id: 'ni-chicken',
    ingredient: mockChickenId,
    usdaFdcId: 12345,
    perGram: {
        __typename: 'NutritionalInfoPerGram' as const,
        calories: 1.65,
        protein: 0.31,
        carbs: 0,
        fat: 0.036,
    },
    perUnit: null,
};

const mockNutritionalInfoApple = {
    __typename: 'NutritionalInfo' as const,
    _id: 'ni-apple',
    ingredient: mockAppleId,
    usdaFdcId: null,
    perGram: null,
    perUnit: {
        __typename: 'NutritionalInfoPerGram' as const,
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
    },
};

function makeMockGetNutritionalInfos(
    ingredientIds: string[],
    results: GetNutritionalInfosByIngredientIdsQuery['nutritionalInfosByIngredientIds']
) {
    return {
        request: {
            query: GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
            variables: { ingredientIds },
        },
        result: {
            data: {
                __typename: 'Query',
                nutritionalInfosByIngredientIds: results,
            } satisfies GetNutritionalInfosByIngredientIdsQuery,
        },
    };
}

// Subsections: 1kg chicken (mass unit)
const chickenSubsections: IngredientSubsectionView[] = [
    {
        __typename: 'IngredientSubsection',
        _id: 'ss-1',
        name: null,
        ingredients: [
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-1',
                quantity: '1',
                unit: mockKilogram,
                size: null,
                ingredient: mockChicken,
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
        ],
    } as unknown as IngredientSubsectionView,
];

// Subsections: 2 apples (no unit = per unit)
const appleSubsections: IngredientSubsectionView[] = [
    {
        __typename: 'IngredientSubsection',
        _id: 'ss-2',
        name: null,
        ingredients: [
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-2',
                quantity: '2',
                unit: null,
                size: null,
                ingredient: mockApple,
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
        ],
    } as unknown as IngredientSubsectionView,
];

// Subsection: chicken with no nutritional info
const noInfoSubsections: IngredientSubsectionView[] = [
    {
        __typename: 'IngredientSubsection',
        _id: 'ss-3',
        name: null,
        ingredients: [
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-3',
                quantity: '1',
                unit: mockGram,
                size: null,
                ingredient: mockChicken,
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
        ],
    } as unknown as IngredientSubsectionView,
];

// Subsections: chicken (no info) + apple (has info) — partial uncounting
const mixedSubsections: IngredientSubsectionView[] = [
    {
        __typename: 'IngredientSubsection',
        _id: 'ss-4',
        name: null,
        ingredients: [
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-chicken',
                quantity: '1',
                unit: mockGram,
                size: null,
                ingredient: mockChicken,
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-apple',
                quantity: '2',
                unit: null,
                size: null,
                ingredient: mockApple,
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
        ],
    } as unknown as IngredientSubsectionView,
];

describe('NutritionalInfoPanel', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders per-serving calories from a mass-unit ingredient', async () => {
        // 1 kg chicken: 1000g × 1.65 kcal/g = 1650 kcal total, 2 servings → 825 kcal/serving
        const MockPanel = () => (
            <NutritionalInfoPanel subsections={chickenSubsections} numServings={2} />
        );
        const routes = createRoutesFromElements(<Route path='/' element={<MockPanel />} />);
        renderPage(routes, [
            mockGetUnitConversions,
            makeMockGetNutritionalInfos([mockChickenId], [mockNutritionalInfoChicken]),
        ]);

        expect(await screen.findByText('Nutritional Info (per serving)')).not.toBeNull();
        // 825 kcal rounded to integer
        expect(await screen.findByText('825 kcal')).not.toBeNull();
    });

    it('renders per-serving calories from a per-unit ingredient', async () => {
        // 2 apples × 95 kcal/unit = 190 kcal total, 1 serving → 190 kcal/serving
        const MockPanel = () => (
            <NutritionalInfoPanel subsections={appleSubsections} numServings={1} />
        );
        const routes = createRoutesFromElements(<Route path='/' element={<MockPanel />} />);
        renderPage(routes, [
            mockGetUnitConversions,
            makeMockGetNutritionalInfos([mockAppleId], [mockNutritionalInfoApple]),
        ]);

        expect(await screen.findByText('Nutritional Info (per serving)')).not.toBeNull();
        expect(await screen.findByText('190 kcal')).not.toBeNull();
    });

    it('shows uncounted notice when some ingredients have no nutritional data', async () => {
        // Mixed: chicken (no info = uncounted), apple (has info = counted)
        const MockPanel = () => (
            <NutritionalInfoPanel subsections={mixedSubsections} numServings={1} />
        );
        const routes = createRoutesFromElements(<Route path='/' element={<MockPanel />} />);
        renderPage(routes, [
            mockGetUnitConversions,
            makeMockGetNutritionalInfos(
                [mockChickenId, mockAppleId],
                [null, mockNutritionalInfoApple]
            ),
        ]);

        await waitFor(() => {
            expect(screen.queryByText(/not counted/i)).not.toBeNull();
        });
    });

    it('shows empty state when all ingredients are uncounted', async () => {
        const MockPanel = () => (
            <NutritionalInfoPanel subsections={noInfoSubsections} numServings={1} />
        );
        const routes = createRoutesFromElements(<Route path='/' element={<MockPanel />} />);
        renderPage(routes, [
            mockGetUnitConversions,
            makeMockGetNutritionalInfos([mockChickenId], [null]),
        ]);

        await waitFor(() => {
            expect(screen.queryByText(/not available/i)).not.toBeNull();
        });
    });
});
