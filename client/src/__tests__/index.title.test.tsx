import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, renderComponent } from '@recipe/utils/tests';
import { mockUpdateRecipeNewTitle } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeNewTitleAsIngredient } from '@recipe/graphql/mutations/__mocks__/recipe';

vi.mock('global', () => ({
    fetch: vi.fn(),
}));

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Title', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update the title', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeNewTitle]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Edit recipe title'));
        await user.keyboard('{Backspace>11/}New Title');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('New Title')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('New Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('New Title', 'Instruction one', screen, user);
        expect(screen.queryByText('New Title')).not.toBeNull();
    });

    it('should update the title when recipe is an ingredient', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
        renderComponent([mockUpdateRecipeNewTitleAsIngredient]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe Two', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Edit recipe title'));
        await user.keyboard('{Backspace>15/}New Title');
        await user.click(screen.getByLabelText('Edit recipe plural title'));
        await user.keyboard('{Backspace>16/}New Titles');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('New Titles')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('New Titles')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('New Title', 'Instruction one', screen, user);
        expect(screen.queryByText('New Title')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe plural title')).toHaveProperty(
            'value',
            'New Titles'
        );
    });
});
