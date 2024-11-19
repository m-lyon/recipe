import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { notNullByText } from '@recipe/utils/tests';
import { mockUpdateRecipeCalculatedTagsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeCalculatedTagsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
import { allNotNullByText, enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeCalculatedTagsRemove } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

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
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'vegetarian', 'special', 'vegan');
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        allNotNullByText(screen, 'vegetarian', 'special', 'vegan');
    });

    it('should display modified calculated tags', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'vegetarian', 'special');
        expect(screen.queryByText('vegan')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        allNotNullByText(screen, 'vegetarian', 'special');
        expect(screen.queryByText('vegan')).toBeNull();
    });

    it('should remove a calculated tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsRemove]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'vegetarian');
        expect(screen.queryByText('vegan')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByText('vegetarian')).not.toBeNull();
        expect(screen.queryByText('vegan')).toBeNull();
    });
});
