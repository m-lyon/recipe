import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeNutritionOverrideShare } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipeNutritionPreviewRecipeOne } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Nutrition overrides', () => {
    afterEach(() => {
        cleanup();
    });

    it('should count a share of an ingredient, and show it to readers', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeNutritionOverrideShare]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getAllByLabelText(/^Nutrition for /)[0]);
        await user.click(await screen.findByLabelText('Count part of it'));
        await user.type(screen.getByLabelText('Percentage to count'), '15');
        await user.click(screen.getByRole('button', { name: 'Apply' }));

        // Expect ------------------------------------------------
        expect(await screen.findByLabelText(/^Nutrition counts 15% of it\. Change for /));
        await user.click(screen.getByLabelText('Save recipe'));
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(await screen.findByLabelText('Nutrition counts 15% of it')).not.toBeNull();
    });

    it('should not apply a set amount it cannot read', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getAllByLabelText(/^Nutrition for /)[0]);
        await user.click(await screen.findByLabelText('Count a set amount'));
        await user.type(screen.getByLabelText('Amount to count'), 'a pinch');

        // Expect ------------------------------------------------
        expect(screen.getByRole('button', { name: 'Apply' })).toHaveProperty('disabled', true);
    });

    it('should show the nutrition of the draft only when opened', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeNutritionPreviewRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        const toggle = screen.getByRole('button', { name: /Nutritional Info/ });
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        await user.click(toggle);

        // Expect ------------------------------------------------
        // 400 kcal over the recipe's 4 servings.
        expect(await screen.findByText('100')).not.toBeNull();
        expect(await screen.findByText('Not counted: 1 ingredient')).not.toBeNull();
    });
});
