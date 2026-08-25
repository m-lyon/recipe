import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterViewRecipePage, notNullByText } from '@recipe/utils/tests';
import { enterCreateNewRecipePage, enterEditRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeInstructionsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructionsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
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

    it('should focus the existing trailing blank when pressing Enter on the last filled instruction', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsAdd]);
        const user = userEvent.setup();
        const label = /^Enter instruction #\d+ for subsection 1$/;

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        const countBefore = screen.getAllByLabelText(label).length;
        // Press Enter on the last filled instruction. The trailing blank is
        // reused (no new line), and focus moves to it, so typing lands there.
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Enter}');
        expect(screen.getAllByLabelText(label)).toHaveLength(countBefore);
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Instruction two.', 'New instruction.');
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

    it('should remove an empty middle instruction on Backspace and focus the end of the previous entry', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();
        const label = /^Enter instruction #\d+ for subsection 1$/;

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        // Insert an empty entry after the first instruction; focus lands on it.
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 1'));
        await user.keyboard('{Enter}');
        const countWithBlank = screen.getAllByLabelText(label).length;
        await user.keyboard('{Backspace}');

        // Expect ------------------------------------------------
        // The empty entry is removed and focus moves to the end of the previous.
        await waitFor(() => {
            expect(screen.getAllByLabelText(label)).toHaveLength(countWithBlank - 1);
        });
        const first = screen.getByLabelText(
            'Enter instruction #1 for subsection 1'
        ) as HTMLTextAreaElement;
        expect(first).toHaveFocus();
        expect(first.selectionStart).toBe('Instruction one.'.length);
    });

    it('should keep the last empty instruction on Backspace and focus the end of the penultimate entry', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();
        const label = /^Enter instruction #\d+ for subsection 1$/;

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        const inputs = screen.getAllByLabelText(label);
        const countBefore = inputs.length;
        // Focus the last (empty trailing) entry and press Backspace.
        await user.click(inputs[inputs.length - 1]);
        await user.keyboard('{Backspace}');

        // Expect ------------------------------------------------
        const penultimate = screen.getByLabelText(
            'Enter instruction #2 for subsection 1'
        ) as HTMLTextAreaElement;
        await waitFor(() => expect(penultimate).toHaveFocus());
        // The trailing blank is kept, not removed.
        expect(screen.getAllByLabelText(label)).toHaveLength(countBefore);
        expect(penultimate.selectionStart).toBe('Instruction two.'.length);
    });

    it('should remove the first empty instruction on Backspace and focus the end of the next entry', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();
        const label = /^Enter instruction #\d+ for subsection 1$/;

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        const countBefore = screen.getAllByLabelText(label).length;
        // Empty the first entry (without blurring), then Backspace on it.
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 1'));
        await user.keyboard('{Backspace>16/}'); // clears 'Instruction one.'
        await user.keyboard('{Backspace}');

        // Expect ------------------------------------------------
        // The first entry is removed and focus moves to the end of the next.
        await waitFor(() => {
            expect(screen.getAllByLabelText(label)).toHaveLength(countBefore - 1);
        });
        const active = document.activeElement as HTMLTextAreaElement;
        expect(active.value).toBe('Instruction two.');
        expect(active.selectionStart).toBe('Instruction two.'.length);
    });

    it('should do nothing on Backspace when only the empty trailing instruction remains', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();
        const label = /^Enter instruction #\d+ for subsection 1$/;

        // Act --------------------------------------------------
        // The create page starts with a single empty instruction.
        await enterCreateNewRecipePage(screen, user);
        const inputs = screen.getAllByLabelText(label);
        expect(inputs).toHaveLength(1);
        await user.click(inputs[0]);
        await user.keyboard('{Backspace}');

        // Expect ------------------------------------------------
        // Nothing to remove or move to; the entry is preserved (no crash).
        expect(screen.getAllByLabelText(label)).toHaveLength(1);
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
