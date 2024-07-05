import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

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
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('A new source');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Source: A new source')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByDisplayValue('A new source')).not.toBeNull();
    });

    it('should remove a source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', 'Example');
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.keyboard('{Backspace}{Backspace}{Backspace}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(screen.queryByText('Source:')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', '');
    });

    it('should update the source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(screen.queryByText('Source: Exa')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(screen.queryByDisplayValue('Exa')).not.toBeNull();
    });
});
