import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeInstructionsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructionsUpdate } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructionsRemove } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add an instruction', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsAdd]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit instruction 2'));
        await user.keyboard('{Enter}');
        await user.click(screen.getByLabelText('Edit instruction 3'));
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Instruction two.')).not.toBeNull();
        expect(screen.queryByText('New instruction.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Instruction two.')).not.toBeNull();
        expect(screen.queryByText('New instruction.')).not.toBeNull();
    });

    it('should edit the instructions', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsUpdate]);
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
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Instruction two')).toBeNull();
        expect(screen.queryByText('New instruction.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Instruction two')).toBeNull();
        expect(screen.queryByText('New instruction.')).not.toBeNull();
    });

    it('should remove an instruction', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructionsRemove]);
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
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Instruction two')).toBeNull();
    });
});
