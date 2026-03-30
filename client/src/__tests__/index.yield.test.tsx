import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeAddYield } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveYield } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeOneNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Yield', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show yield when recipe has no yield', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        expect(screen.queryByLabelText('Recipe yield')).toBeNull();
    });

    it('should add a yield', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddYield]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Edit yield quantity'));
        await user.keyboard('2');
        await user.click(screen.getAllByLabelText('Edit yield unit')[0]);
        await user.click(await screen.findByText('cup (cup)'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Yield: 2 cups');
        expect(await screen.findByLabelText('Recipe yield')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.getByLabelText('Edit yield quantity')).toHaveProperty('value', '2');
    });

    it('should remove a yield', async () => {
        // Render -----------------------------------------------
        // First add yield (updates Apollo cache), then remove it
        renderComponent([mockUpdateRecipeAddYield, mockUpdateRecipeRemoveYield]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        // Add yield first so the cache has yield data
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Edit yield quantity'));
        await user.keyboard('2');
        await user.click(screen.getAllByLabelText('Edit yield unit')[0]);
        await user.click(await screen.findByText('cup (cup)'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Navigate back and re-enter edit page (cache now has yield: 2 cups)
        await user.click(await screen.findByLabelText('Navigate to home page'));
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.getByLabelText('Edit yield quantity')).toHaveProperty('value', '2');

        // Remove the yield quantity
        await user.tripleClick(screen.getByLabelText('Edit yield quantity'));
        await user.keyboard('{Backspace}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByLabelText('Recipe yield')).toBeNull();
    });

    it('should show invalid quantity toast and clear the field', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Edit yield quantity'));
        await user.keyboard('abc');
        await user.tab(); // trigger blur

        // Expect ------------------------------------------------
        expect(await screen.findByText('Invalid yield quantity')).not.toBeNull();
        expect(screen.getByLabelText('Edit yield quantity')).toHaveProperty('value', '');
    });

    it('should save without error when unit is selected but quantity is empty', async () => {
        // Render -----------------------------------------------
        // Selecting a unit with no quantity is valid — yield is omitted from submission
        renderComponent([mockUpdateRecipeOneNoChange]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getAllByLabelText('Edit yield unit')[0]);
        await user.click(await screen.findByText('cup (cup)'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // No error toast, recipe saved normally (navigates to home page)
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Invalid yield quantity')).toBeNull();
    });

    it('should scale yield quantity when servings change', async () => {
        // Render -----------------------------------------------
        // Add yield first so the view page cache has yield data
        renderComponent([mockUpdateRecipeAddYield]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        // Add yield via edit page (updates cache with yield: 2 cups, numServings: 4)
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Edit yield quantity'));
        await user.keyboard('2');
        await user.click(screen.getAllByLabelText('Edit yield unit')[0]);
        await user.click(await screen.findByText('cup (cup)'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Navigate to view page (cache has yield: 2 cups, numServings: 4)
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Yield: 2 cups');

        // Increase servings from 4 to 5
        await user.click(screen.getByLabelText('Increase serving size'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();

        // Expect ------------------------------------------------
        // 2 cups at 4 servings → 5 servings = 2.5 → formatFraction renders as 2½ cups
        expect(screen.getByLabelText('Recipe yield')).toHaveProperty(
            'textContent',
            'Yield: 2\u00BD cups'
        );
    });
});
