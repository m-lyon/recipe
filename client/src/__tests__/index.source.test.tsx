import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeAddSource } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveSource } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeUpdateSource } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Source', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add a source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('A new source');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Source: A new source');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        expect(await screen.findByDisplayValue('A new source')).not.toBeNull();
    });

    it('should remove a source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', 'Example');
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace>7/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        expect(screen.queryByText('Source:')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', '');
    });

    it('should update the source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace>4/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Source: Exa');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        expect(screen.queryByDisplayValue('Exa')).not.toBeNull();
    });
});
