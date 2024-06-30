import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeNewTitle } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeNumServings } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeNewTitleAsIngredient } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

vi.mock('global', () => ({
    fetch: vi.fn(),
}));

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to the edit recipe page', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        const recipe = await screen.findByLabelText('View Mock Recipe');
        await user.hover(recipe);
        await user.click(screen.getByLabelText('Edit Mock Recipe'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Instruction one')).not.toBeNull();
    });

    it('should update the servings', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeNumServings]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Increase serving size'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
    });

    it('should update the title', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeNewTitle]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe title'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Mock '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Recip'
        await user.keyboard('{Backspace}{Backspace}'); // remove 'e
        await user.keyboard('New Title');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View New Title'));
        await user.click(screen.getByLabelText('Edit New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(await screen.findByText('New Title')).not.toBeNull();
    });

    it('should update the title when recipe is an ingredient', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
        renderComponent([mockUpdateRecipeNewTitleAsIngredient]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Two'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe title'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Mock '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Recip'
        await user.keyboard('{Backspace}{Backspace}'); // remove 'e '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Two'
        await user.keyboard('New Title');
        await user.click(screen.getByLabelText('Edit recipe plural title'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Mock '
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Recip'
        await user.keyboard('{Backspace}{Backspace}'); // remove 'es'
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); // remove ' Two'
        await user.keyboard('New Titles');
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
        await user.hover(await screen.findByLabelText('View New Title'));
        await user.click(screen.getByLabelText('Edit New Title'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('New Title')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe plural title')).toHaveProperty(
            'value',
            'New Titles'
        );
    });
});

// TODO: check that calculatedTags updates appear on View and Home pages

// describe('Create Recipe Workflow', () => {
//     afterEach(() => {
//         cleanup();
//     });
// });

// describe('Delete Recipe Workflow', () => {
//     afterEach(() => {
//         cleanup();
//     });
// });
