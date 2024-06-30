import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockCreateRecipe } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

vi.mock('global', () => ({
    fetch: vi.fn(),
}));

loadErrorMessages();
loadDevMessages();

describe('Create Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('should create a recipe', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Ingredients')).not.toBeNull();
        // --- Add Title ----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe title'));
        await user.keyboard('New Recipe');
        // --- Add Tag -------------------------------------------
        await user.click(screen.getByLabelText('Add a tag'));
        await user.click(await screen.findByText('freezable'));
        // --- Add Instructions ----------------------------------
        await user.click(screen.getByLabelText('Edit instruction 1'));
        await user.keyboard('Instr #1.{Enter}Instr #2.{Enter}');
        // --- Change servings -----------------------------------
        await user.click(screen.getByLabelText('Increase serving size'));
        // --- Add Notes -----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('Recipe Notes.');
        // --- Add Source ----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('Recipe Source');
        // --- Add Ingredients -----------------------------------
        await user.click(screen.getByLabelText('Enter ingredient'));
        await user.keyboard('{2}{ }');
        await user.click(await screen.findByText('teaspoons'));
        await user.click(await screen.findByText('apples'));
        await user.click(await screen.findByText('diced'));
        // --- Save Recipe ---------------------------------------
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('New Recipe')).not.toBeNull();
        expect(screen.queryByText('freezable')).not.toBeNull();

        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View New Recipe'));
        expect(await screen.findByText('Instr #1.')).not.toBeNull();
        expect(screen.queryByText('Instr #2.')).not.toBeNull();
        expect(screen.queryByText('2 Servings')).not.toBeNull();
        expect(screen.queryByText('Recipe Notes.')).not.toBeNull();
        expect(screen.queryByText('Recipe Source')).not.toBeNull();
        expect(screen.queryByText('2 tsp apples, diced')).not.toBeNull();
        expect(screen.queryByText('freezable')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));

        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View New Recipe'));
        await user.click(screen.getByLabelText('Edit New Recipe'));
        expect(await screen.findByText('Instr #1.')).not.toBeNull();
        expect(screen.queryByText('Instr #2.')).not.toBeNull();
        expect(screen.queryByText('2 Servings')).not.toBeNull();
        expect(screen.queryByText('Recipe Notes.')).not.toBeNull();
        expect(screen.queryByText('Recipe Source')).not.toBeNull();
        expect(screen.queryByText('1 tsp apples, diced')).not.toBeNull();
        expect(screen.queryByText('freezable')).not.toBeNull();
    });

    // it('should create a recipe with an image', async () => {
    //     // Render -----------------------------------------------
    //     renderComponent([]);
    //     const user = userEvent.setup();
    // });
});
