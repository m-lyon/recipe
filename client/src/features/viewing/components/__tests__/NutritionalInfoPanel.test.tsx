import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { MacroNutrients } from '@recipe/utils/nutrition';

import { NutritionalInfoPanel } from '../NutritionalInfoPanel';

loadErrorMessages();
loadDevMessages();

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
                        perServing={{ calories: 825, protein: 31, carbs: 0, fat: 3.6 }}
                        uncountedIds={new Set()}
                        allUncounted={false}
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
                        perServing={{ calories: 825, protein: 31, carbs: 0, fat: 3.6 }}
                        uncountedIds={new Set()}
                        allUncounted={false}
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
                        perServing={emptyMacros}
                        uncountedIds={new Set()}
                        allUncounted={false}
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
        // Partial uncounting: some ingredients counted, some not → allUncounted=false
        const routes = createRoutesFromElements(
            <Route
                path='/'
                element={
                    <NutritionalInfoPanel
                        perServing={{ calories: 190, protein: 0.5, carbs: 25, fat: 0.3 }}
                        uncountedIds={new Set(['ri-1'])}
                        allUncounted={false}
                        loading={false}
                    />
                }
            />
        );
        renderPage(routes, []);
        expect(screen.queryByText(/not counted/i)).not.toBeNull();
    });

    it('shows empty state when all ingredients are uncounted', () => {
        const routes = createRoutesFromElements(
            <Route
                path='/'
                element={
                    <NutritionalInfoPanel
                        perServing={emptyMacros}
                        uncountedIds={new Set(['ri-1'])}
                        allUncounted={true}
                        loading={false}
                    />
                }
            />
        );
        renderPage(routes, []);
        expect(screen.queryByText(/not available/i)).not.toBeNull();
    });
});
