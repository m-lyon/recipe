import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, haveValueByLabelText } from '@recipe/utils/tests';
import { mockUpdateRecipeAddIsIngredient } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveAsIngredient } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Is Ingredient', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update recipe to be an ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddIsIngredient]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Toggle recipe as ingredient'));
        await user.click(screen.getByLabelText('Edit recipe plural title'));
        await user.keyboard('Mock Recipes');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipes')).not.toBeNull();

        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Mock Recipes')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));

        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        expect(screen.queryByText('Mock Recipe')).not.toBeNull();
        haveValueByLabelText(screen, 'Edit recipe plural title', 'Mock Recipes');

        // ------ Ingredient List --------------------------------
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await user.click(await screen.findByText('skip unit'));
        expect(screen.queryByText('mock recipes')).not.toBeNull();
    });

    it('should update recipe to remove as an ingredient', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
        renderComponent([mockUpdateRecipeRemoveAsIngredient]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe Two', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Toggle recipe as ingredient'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipes Two')).toBeNull();
        expect(screen.queryByText('Mock Recipe Two')).not.toBeNull();

        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Two'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Mock Recipes Two')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));

        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe Two', 'Instruction one', screen, user);
        expect(screen.queryByText('Mock Recipe Two')).not.toBeNull();
        expect(screen.queryByLabelText('Edit recipe plural title')).toBeNull();

        // ------ Ingredient List --------------------------------
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await user.click(await screen.findByText('skip unit'));
        expect(screen.queryByText('mock recipes two')).toBeNull();
    });
});
