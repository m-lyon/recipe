import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { clickGetByText, haveValueByLabelText } from '@recipe/utils/tests';
import { enterCreateNewRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUsdaSearchOnion } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemOnion } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockCreateIngredientOnion } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockCreateMeasureOnionLarge } from '@recipe/graphql/mutations/__mocks__/ingredientMeasure';
import { mockCreateNutritionalInfoOnion } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockGetRecipeNutritionForRecipeOne } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockCreateMeasureAppleTeaspoon } from '@recipe/graphql/mutations/__mocks__/ingredientMeasure';
import { mockCreateMeasureOnionCupChopped } from '@recipe/graphql/mutations/__mocks__/ingredientMeasure';
import { mockGetRecipeNutritionForRecipeOneEmpty } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockGetRecipeNutritionForRecipeOneWithTeaspoon } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('NutritionalInfoPanel integration', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display per-serving macros when nutritional data is available', async () => {
        // Render -----------------------------------------------
        // Recipe One has 4 servings, 5 ingredient items (apple ×4, carrot ×1). Apple and
        // carrot each have an item weight (182 g, 61 g) and no volume weight:
        //   - 1 tsp apple            → no volume measure → uncounted
        //   - 1 small carrot (each)  → 61 g × 0.41 = 25.01 cal
        //   - 2 apples (each)        → 364 g × 0.52 = 189.28 cal
        //   - 1/3 cup apple          → no volume measure → uncounted
        //   - 1 oz apple (mass)      → 28.35 g × 0.52 = 14.74 cal
        // Total = 229.03 cal / 4 servings = 57.26 → "57 kcal"
        renderComponent([mockGetRecipeNutritionForRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        expect(await screen.findByText('Nutritional Info (per serving)')).not.toBeNull();
        expect(await screen.findByText('57 kcal')).not.toBeNull();
        // protein (0.549 + 1.177) / 4 = 0.43, carbs (5.856 + 54.144) / 4 = 15,
        // fat (0.122 + 0.785) / 4 = 0.23
        expect(screen.getByText('0.4 g')).not.toBeNull();
        expect(screen.getByText('15 g')).not.toBeNull();
        expect(screen.getByText('0.2 g')).not.toBeNull();
    });

    it('should name the missing measure for each uncounted line', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeNutritionForRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        expect(await screen.findByText(/not counted: 2 ingredients/i)).not.toBeNull();
        expect(
            screen.getByText(/no weight recorded for 1 teaspoon of apple/i, { exact: false })
        ).not.toBeNull();
        expect(
            screen.getByText(/no weight recorded for 1 cup of medium apple/i, { exact: false })
        ).not.toBeNull();
    });

    it('should count a line once its weight is saved from the prompt', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockGetRecipeNutritionForRecipeOne,
            mockCreateMeasureAppleTeaspoon,
            mockGetRecipeNutritionForRecipeOneWithTeaspoon,
        ]);
        const user = userEvent.setup();
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(await screen.findByText('57 kcal')).not.toBeNull();

        // Act -- the least specific option is the default, so one answer covers most lines
        const prompt = await screen.findByText('How much does 1 teaspoon of diced apple weigh?');
        expect(prompt).not.toBeNull();
        expect(screen.getByLabelText('"teaspoon of apple"')).toHaveProperty('checked', true);
        await user.type(screen.getByLabelText('Grams in 1 teaspoon of diced apple'), '5');

        await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);

        // Expect -- a volume row is a density, so it prices both volume lines:
        //   1 tsp apple   = 5 g        × 0.52 = 2.6 cal
        //   1/3 cup apple = 16 tsp = 80 g × 0.52 = 41.6 cal
        // (229.03 + 2.6 + 41.6) / 4 = 68.3 → "68 kcal", and nothing is left uncounted.
        expect(await screen.findByText('68 kcal')).not.toBeNull();
        expect(screen.queryByText(/not counted/i)).toBeNull();
    });

    it('should show empty state when no nutritional data exists', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeNutritionForRecipeOneEmpty]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        expect(await screen.findByText(/not available/i)).not.toBeNull();
    });

    it('should collapse and expand the panel on toggle click', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeNutritionForRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Panel starts open
        const toggle = await screen.findByRole('button', { name: /nutritional info/i });
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(await screen.findByText('57 kcal')).not.toBeNull();

        // Collapse
        await user.click(toggle);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');

        // Expand again
        await user.click(toggle);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(await screen.findByText('57 kcal')).not.toBeNull();
    });
});

describe('USDA portions as measures from the new ingredient form', () => {
    afterEach(() => {
        cleanup();
    });

    it('should stage USDA portions as measures and save them once the ingredient exists', async () => {
        // A brand new ingredient has no _id yet, so the nutrition link and the measures are
        // staged and committed after ingredientCreateOne returns one.
        const user = userEvent.setup();
        renderComponent([
            mockUsdaSearchOnion,
            mockUsdaFoodItemOnion,
            mockCreateIngredientOnion,
            mockCreateNutritionalInfoOnion,
            mockCreateMeasureOnionLarge,
            mockCreateMeasureOnionCupChopped,
        ]);

        // Act -- open the new ingredient form from the recipe ingredient popover
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'skip size', 'add new ingredient');
        await user.keyboard('onion');
        await user.click(screen.getByText(/^Countable/));

        // Act -- search USDA and select the record, which fetches its portions
        await user.type(screen.getByLabelText('Search nutritional data'), 'onion');
        await user.click(screen.getByLabelText('Search USDA database'));
        await user.click(await screen.findByText('Onions, raw'));

        // Act -- "1 large" maps to each + size large, "cup, chopped" to cup + chopped
        await user.click(await screen.findByLabelText('Add USDA measure 1 large (150 g)'));
        await user.click(screen.getByLabelText('Add USDA measure 1 cup, chopped (160 g)'));
        expect(screen.getByText('1 each · large = 150 g')).not.toBeNull();
        expect(screen.getByText('1 cup · chopped = 160 g')).not.toBeNull();
        // Per-unit macros are shown, not stored: 150 g × 0.4 kcal/g
        expect(screen.getByText('60 kcal')).not.toBeNull();

        // Act -- stage the link, then save the ingredient
        await user.click(screen.getByLabelText('Link selected nutritional data'));
        expect(await screen.findByText(/Linked: onions, raw/)).not.toBeNull();
        await user.click(screen.getByLabelText('Save ingredient'));

        // Expect -- every mutation matched its mock; a mismatch would surface as an Apollo
        // "no more mocked responses" error and the ingredient would never reach the input.
        await waitFor(() =>
            haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 onion, ')
        );
    });
});
