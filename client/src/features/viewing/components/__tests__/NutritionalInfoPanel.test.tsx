import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { MacroNutrients } from '@recipe/utils/nutrition';

import { NutritionalInfoPanel } from '../NutritionalInfoPanel';

loadErrorMessages();
loadDevMessages();

// Subsections: minimal fixture used for the allUncounted calculation
const singleIngredientSubsection: IngredientSubsectionView[] = [
    {
        __typename: 'IngredientSubsection',
        _id: 'ss-1',
        name: null,
        ingredients: [
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-1',
                quantity: '1',
                unit: null,
                ingredient: {
                    __typename: 'Ingredient',
                    _id: 'ing-1',
                    name: 'Apple',
                    density: null,
                },
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
        ],
    } as unknown as IngredientSubsectionView,
];

// Subsections: two ingredients — used for partial uncounting tests
const twoIngredientSubsection: IngredientSubsectionView[] = [
    {
        __typename: 'IngredientSubsection',
        _id: 'ss-2',
        name: null,
        ingredients: [
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-1',
                quantity: '1',
                unit: null,
                ingredient: {
                    __typename: 'Ingredient',
                    _id: 'ing-1',
                    name: 'Apple',
                    density: null,
                },
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
            {
                __typename: 'RecipeIngredient',
                _id: 'ri-2',
                quantity: '2',
                unit: null,
                ingredient: {
                    __typename: 'Ingredient',
                    _id: 'ing-2',
                    name: 'Chicken',
                    density: null,
                },
                prepMethod: null,
            } as unknown as IngredientSubsectionView['ingredients'][number],
        ],
    } as unknown as IngredientSubsectionView,
];

const emptyMacros: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

describe('NutritionalInfoPanel', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders the panel header', () => {
        const routes = createRoutesFromElements(
            <Route
                path='/'
                element={
                    <NutritionalInfoPanel
                        subsections={singleIngredientSubsection}
                        perServing={{ calories: 825, protein: 31, carbs: 0, fat: 3.6 }}
                        uncountedIds={new Set()}
                        loading={false}
                    />
                }
            />
        );
        renderPage(routes, []);
        expect(screen.queryByText('Nutritional Info (per serving)')).not.toBeNull();
    });

    it('renders per-serving calories when data is available', () => {
        // 825 kcal (pre-computed and passed in as prop)
        const routes = createRoutesFromElements(
            <Route
                path='/'
                element={
                    <NutritionalInfoPanel
                        subsections={singleIngredientSubsection}
                        perServing={{ calories: 825, protein: 31, carbs: 0, fat: 3.6 }}
                        uncountedIds={new Set()}
                        loading={false}
                    />
                }
            />
        );
        renderPage(routes, []);
        expect(screen.queryByText('825 kcal')).not.toBeNull();
    });

    it('renders skeleton placeholders while loading', () => {
        const routes = createRoutesFromElements(
            <Route
                path='/'
                element={
                    <NutritionalInfoPanel
                        subsections={singleIngredientSubsection}
                        perServing={emptyMacros}
                        uncountedIds={new Set()}
                        loading={true}
                    />
                }
            />
        );
        renderPage(routes, []);
        // Skeletons are rendered; the macros text should not be visible
        expect(screen.queryByText('kcal')).toBeNull();
    });

    it('shows uncounted notice when some ingredients have no nutritional data', () => {
        // Two ingredients; only ri-1 is uncounted → partial uncounting (not allUncounted)
        const routes = createRoutesFromElements(
            <Route
                path='/'
                element={
                    <NutritionalInfoPanel
                        subsections={twoIngredientSubsection}
                        perServing={{ calories: 190, protein: 0.5, carbs: 25, fat: 0.3 }}
                        // Only ri-1 is uncounted; ri-2 is counted, so allUncounted = false
                        uncountedIds={new Set(['ri-1'])}
                        loading={false}
                    />
                }
            />
        );
        renderPage(routes, []);
        expect(screen.queryByText(/not counted/i)).not.toBeNull();
    });

    it('shows empty state when all ingredients are uncounted', () => {
        // ri-1 is the only Ingredient-type item; it's in uncountedIds → allUncounted = true
        const routes = createRoutesFromElements(
            <Route
                path='/'
                element={
                    <NutritionalInfoPanel
                        subsections={singleIngredientSubsection}
                        perServing={emptyMacros}
                        uncountedIds={new Set(['ri-1'])}
                        loading={false}
                    />
                }
            />
        );
        renderPage(routes, []);
        expect(screen.queryByText(/not available/i)).not.toBeNull();
    });
});
