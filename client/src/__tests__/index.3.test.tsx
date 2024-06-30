import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeAddNote } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveNotes } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeUpdateNotes } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructions } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update the instructions', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructions]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit instruction 2'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Inst'
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'ruct'
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'ion '
        await user.keyboard('{Backspace}{Backspace}{Backspace}'); // remove 'Two'
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('New instruction.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('New instruction.')).not.toBeNull();
    });

    it('should add a note', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddNote]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('A new note{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
    });

    it('should remove a note', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveNotes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe notes')).toHaveProperty('value', 'Notes');
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Notes:')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe notes')).toHaveProperty('value', '');
    });

    it('should update the notes', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateNotes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.keyboard('A new note.');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
    });
});
