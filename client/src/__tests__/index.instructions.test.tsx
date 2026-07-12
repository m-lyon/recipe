import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeInstructionsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructionsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
import { enterEditRecipePage, enterViewRecipePage, notNullByText } from '@recipe/utils/tests';
import { mockUpdateRecipeInstructionsInsert } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructionsRemove } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Instructions', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add an instruction', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsAdd]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Enter}');
        await user.click(screen.getByLabelText('Enter instruction #3 for subsection 1'));
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Instruction two.', 'New instruction.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Instruction two.', 'New instruction.');
    });

    it('should insert an instruction between existing ones', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsInsert]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        // Focus the first (populated) instruction and press Enter. This should
        // insert an empty instruction immediately after it and move focus there,
        // so typing lands between 'Instruction one.' and 'Instruction two.'.
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 1'));
        await user.keyboard('{Enter}');
        await user.keyboard('Inserted instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Inserted instruction.', 'Instruction two.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Inserted instruction.', 'Instruction two.');
    });

    it('should not insert a blank when pressing Enter on an empty instruction', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();
        const label = /^Enter instruction #\d+ for subsection 1$/;

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        const inputs = screen.getAllByLabelText(label);
        const countBefore = inputs.length;

        // Expect ------------------------------------------------
        // The last instruction is the empty trailing line. Pressing Enter on it
        // must not insert another blank.
        await user.click(inputs[inputs.length - 1]);
        await user.keyboard('{Enter}');
        expect(screen.getAllByLabelText(label)).toHaveLength(countBefore);
    });

    it('should add exactly one trailing blank when pressing Enter on the last instruction', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();
        const label = /^Enter instruction #\d+ for subsection 1$/;

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        const inputs = screen.getAllByLabelText(label);
        const countBefore = inputs.length;
        // Populate the trailing (last) instruction, then press Enter.
        await user.click(inputs[inputs.length - 1]);
        await user.keyboard('Third step{Enter}');

        // Expect ------------------------------------------------
        // Exactly one new blank line should be appended (no double-blank).
        expect(screen.getAllByLabelText(label)).toHaveLength(countBefore + 1);
    });

    it('should edit the instructions', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Backspace>16/}New instruction!');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'New instruction!');
        expect(screen.queryByText('Instruction two.')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByText('Instruction two.')).toBeNull();
        expect(screen.queryByText('New instruction!')).not.toBeNull();
    });

    it('should remove an instruction', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsRemove]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Backspace>16/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByText('Instruction two.')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByText('Instruction two.')).toBeNull();
    });
});
