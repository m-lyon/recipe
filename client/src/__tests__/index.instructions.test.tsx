import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, notNullByText } from '@recipe/utils/tests';
import { mockUpdateRecipeInstructionsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructionsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
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
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Enter}');
        await user.click(screen.getByLabelText('Enter instruction #3 for subsection 1'));
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'Instruction two.', 'New instruction.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await notNullByText(screen, 'Instruction two.', 'New instruction.');
    });

    it('should edit the instructions', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Backspace>15/}New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'New instruction.');
        expect(screen.queryByText('Instruction two')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        expect(screen.queryByText('Instruction two')).toBeNull();
        expect(screen.queryByText('New instruction.')).not.toBeNull();
    });

    it('should remove an instruction', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsRemove]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter instruction #2 for subsection 1'));
        await user.keyboard('{Backspace>15/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Instruction two')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        expect(screen.queryByText('Instruction two')).toBeNull();
    });
});
