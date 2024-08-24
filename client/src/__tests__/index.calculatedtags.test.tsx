import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, notNullByText, renderComponent } from '@recipe/utils/tests';
import { mockUpdateRecipeCalculatedTagsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeCalculatedTagsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeCalculatedTagsRemove } from '@recipe/graphql/mutations/__mocks__/recipe';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Calculated Tags', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add a new calculated tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsAdd]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'vegetarian', 'special', 'vegan');
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'vegetarian', 'special', 'vegan');
    });

    it('should display edit calculated tags', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'vegetarian', 'special');
        expect(screen.queryByText('vegan')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'vegetarian', 'special');
        expect(screen.queryByText('vegan')).toBeNull();
    });

    it('should remove a calculated tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsRemove]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'vegetarian');
        expect(screen.queryByText('vegan')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'vegetarian');
        expect(screen.queryByText('vegan')).toBeNull();
    });
});
