import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterViewRecipePage } from '@recipe/utils/tests';
import { mockGetNutritionalInfosForRecipeOne } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockGetNutritionalInfosForRecipeOneEmpty } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('NutritionalInfoPanel integration', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display per-serving macros when nutritional data is available', async () => {
        // Render -----------------------------------------------
        // Recipe One has 4 servings, 5 ingredient items (apple ×3, carrot ×1).
        // With the provided nutritional data:
        //   - apple + tsp (no measureType) → uncounted
        //   - carrot + no unit, qty 1 → perUnit × 1 = 25 cal
        //   - apple + no unit, qty 2 → perUnit × 2 = 190 cal
        //   - apple + cup (volume, no density) → uncounted
        //   - apple + oz (mass, no conversion rule) → uncounted
        // Total = 215 cal / 4 servings = 53.75 → "54 kcal"
        renderComponent([mockGetNutritionalInfosForRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        expect(await screen.findByText('Nutritional Info (per serving)')).not.toBeNull();
        expect(await screen.findByText('54 kcal')).not.toBeNull();
    });

    it('should show uncounted notice when some ingredients lack data', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetNutritionalInfosForRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        // 3 of 5 ingredient items are uncounted
        expect(await screen.findByText(/not counted/i)).not.toBeNull();
        expect(await screen.findByText(/3 ingredient/i)).not.toBeNull();
    });

    it('should show empty state when no nutritional data exists', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetNutritionalInfosForRecipeOneEmpty]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        expect(await screen.findByText(/not available/i)).not.toBeNull();
    });
});
