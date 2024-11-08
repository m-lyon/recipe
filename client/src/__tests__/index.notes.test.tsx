import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeAddNote } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveNotes } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeUpdateNotes } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Notes', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add a note', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddNote]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('A new note {Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'A new note.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(await screen.findByText('A new note.')).not.toBeNull();
    });

    it('should remove a note', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveNotes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');
        expect(screen.getByLabelText('Edit recipe notes')).toHaveProperty('value', 'Notes.');
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('{Backspace>6/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');
        expect(screen.queryByText('Notes:')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');
        expect(screen.getByLabelText('Edit recipe notes')).toHaveProperty('value', '');
    });

    it('should update the notes', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateNotes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('{Backspace>6/}A new note.');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'A new note.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');
        expect(await screen.findByText('A new note.')).not.toBeNull();
    });
});
