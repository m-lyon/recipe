import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, renderComponent } from '@recipe/utils/tests';
import { mockUpdateRecipeAddSource } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveSource } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeUpdateSource } from '@recipe/graphql/mutations/__mocks__/recipe';

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
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
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
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        expect(await screen.findByDisplayValue('A new source')).not.toBeNull();
    });

    it('should remove a source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe Three', 'Instruction one', screen, user);
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', 'Example');
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace>7/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(screen.queryByText('Source:')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe Three', 'Instruction one', screen, user);
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', '');
    });

    it('should update the source', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateSource]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe Three', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('{Backspace>4/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(screen.queryByText('Source: Exa')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe Three', 'Instruction one', screen, user);
        expect(screen.queryByDisplayValue('Exa')).not.toBeNull();
    });
});
