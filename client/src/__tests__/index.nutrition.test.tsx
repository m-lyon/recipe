import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { renderPage } from '@recipe/utils/tests';
import { haveValueByLabelText } from '@recipe/utils/tests';
import { enterCreateNewRecipePage } from '@recipe/utils/tests';
import { clickGetByText, enterViewRecipePage } from '@recipe/utils/tests';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockUsdaSearchOnion } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemOnion } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaSearchOliveOil } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemOliveOil } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { ONION_CUP_DENSITY_APPLIED } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { OLIVE_OIL_CUP_DENSITY_APPLIED } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockCreateNutritionalInfoOnion } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockCreateIngredientOnionWithDensity } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockUpdateIngredientCarrotWithDensity } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockGetNutritionalInfosForRecipeOne } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockGetNutritionalInfosForRecipeOneEmpty } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockGetNutritionalInfosForEditIngredient } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { routes } from '../routes';
import { renderComponent } from './utils';
import { mocks as defaultMocks } from '../__mocks__/graphql';

loadErrorMessages();
loadDevMessages();

describe('NutritionalInfoPanel integration', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display per-serving macros when nutritional data is available', async () => {
        // Render -----------------------------------------------
        // Recipe One has 4 servings, 5 ingredient items (apple ×3, carrot ×1).
        // With the provided nutritional data (see recipeBothNutritionResult in
        // graphql/queries/__mocks__/nutritionalInfo.ts):
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
        // Macro values: (carrot 1× + apple 2×) / 4 servings
        //   protein: (0.6 + 1.0) / 4 = 0.4, carbs: (5.8 + 50) / 4 = 13.95, fat: (0.1 + 0.6) / 4 = 0.175
        expect(screen.getByText('0.4 g')).not.toBeNull();
        expect(screen.getByText('13.9 g')).not.toBeNull();
        expect(screen.getByText('0.2 g')).not.toBeNull();
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

    it('should collapse and expand the panel on toggle click', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetNutritionalInfosForRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Panel starts open
        const toggle = await screen.findByRole('button', { name: /nutritional info/i });
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(await screen.findByText('54 kcal')).not.toBeNull();

        // Collapse
        await user.click(toggle);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');

        // Expand again
        await user.click(toggle);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(await screen.findByText('54 kcal')).not.toBeNull();
    });
});

describe('USDA portion linking from the new ingredient form', () => {
    afterEach(() => {
        cleanup();
    });

    it('should save an applied density with the new ingredient and a derived perUnit with the link', async () => {
        // The create flow is the case a separate density mutation could not serve: a
        // brand new ingredient has no _id yet, so the density must ride in the create
        // record and the nutrition link must follow once the id exists.
        const user = userEvent.setup();
        renderComponent([
            mockUsdaSearchOnion,
            mockUsdaFoodItemOnion,
            mockCreateIngredientOnionWithDensity,
            mockCreateNutritionalInfoOnion,
        ]);

        // Act -- open the new ingredient form from the recipe ingredient popover
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'skip size', 'add new ingredient');
        await user.keyboard('onion');
        await user.click(screen.getByText('Countable'));

        // Act -- search USDA and select the record, which fetches its portions
        await user.type(screen.getByLabelText('Search nutritional data'), 'onion');
        await user.click(screen.getByLabelText('Search USDA database'));
        await user.click(await screen.findByText('Onions, raw'));

        // Act -- choose the portion that means "one onion", filling perUnit without typing
        await user.click(await screen.findByRole('radio', { name: /1 large/ }));
        haveValueByLabelText(screen, 'Per unit calories', '60');
        haveValueByLabelText(screen, 'Per unit carbs', '14.01');

        // Act -- accept the suggested density, which lands in the form's own field
        await user.click(screen.getByLabelText('Apply suggested density'));
        await waitFor(() =>
            expect(screen.getByLabelText('Density (g/ml)')).toHaveProperty(
                'value',
                String(ONION_CUP_DENSITY_APPLIED)
            )
        );

        // Act -- stage the link, then save the ingredient
        await user.click(screen.getByLabelText('Link selected nutritional data'));
        expect(await screen.findByText(/Linked: onions, raw/)).not.toBeNull();
        await user.click(screen.getByLabelText('Save ingredient'));

        // Expect -- both mutations matched their mocks: ingredientCreateOne carried the
        // density, and the follow-up nutritionalInfoCreateOne carried the derived perUnit.
        // A mismatch on either would surface as an Apollo "no more mocked responses" error
        // and the ingredient would never reach the recipe input below.
        await waitFor(() =>
            haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 onion, ')
        );
    });
});

describe('USDA portion linking from the edit ingredient page', () => {
    afterEach(() => {
        cleanup();
    });

    it('should save an applied density through the ordinary ingredient update', async () => {
        const user = userEvent.setup();
        renderPage(
            routes,
            [
                ...defaultMocks,
                mockGetIngredients,
                mockGetNutritionalInfosForEditIngredient,
                mockUsdaSearchOliveOil,
                mockUsdaFoodItemOliveOil,
                mockUpdateIngredientCarrotWithDensity,
            ],
            [`${PATH.ROOT}/edit/ingredient`]
        );

        // Act -- pick an ingredient to edit
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots')
        );

        // Act -- search USDA and select a record with a volume portion
        await user.clear(screen.getByLabelText('Search nutritional data'));
        await user.type(screen.getByLabelText('Search nutritional data'), 'olive oil');
        await user.click(screen.getByLabelText('Search USDA database'));
        await user.click(await screen.findByText('Oil, olive, salad or cooking'));

        // Act -- accept the suggestion; it fills the form field, it does not save
        await user.click(await screen.findByLabelText('Apply suggested density'));
        await waitFor(() =>
            expect(screen.getByLabelText('Density (g/ml)')).toHaveProperty(
                'value',
                String(OLIVE_OIL_CUP_DENSITY_APPLIED)
            )
        );

        // Act -- the ordinary Save persists it
        await user.click(screen.getByLabelText('Save ingredient'));

        // Expect -- mockUpdateIngredientCarrotWithDensity matched, so the density
        // reached ingredientUpdateById; the reloaded form shows the saved value.
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'chicken' }));
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Density (g/ml)')).toHaveProperty(
                'value',
                String(OLIVE_OIL_CUP_DENSITY_APPLIED)
            )
        );
    });
});
