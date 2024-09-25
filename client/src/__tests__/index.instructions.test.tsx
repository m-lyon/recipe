import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeInstructionsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructionsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
import { enterEditRecipePage, enterViewRecipePage, notNullByText } from '@recipe/utils/tests';
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
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Enter}');
        await user.click(screen.getByLabelText('Enter instruction #3 for subsection 1'));
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await notNullByText(screen, 'Instruction two.', 'New instruction.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await notNullByText(screen, 'Instruction two.', 'New instruction.');
    });

    it('should edit the instructions', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Backspace>15/}New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await notNullByText(screen, 'New instruction.');
        expect(screen.queryByText('Instruction two')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        expect(screen.queryByText('Instruction two')).toBeNull();
        expect(screen.queryByText('New instruction.')).not.toBeNull();
    });

    it('should remove an instruction', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsRemove]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Backspace>15/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        expect(screen.queryByText('Instruction two')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        expect(screen.queryByText('Instruction two')).toBeNull();
    });
});
