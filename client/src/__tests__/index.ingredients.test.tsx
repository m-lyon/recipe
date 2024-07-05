import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeIngredientsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Ingredients', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update the ingredients', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeIngredientsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Remove 2 apples, diced'));
        await user.click(screen.getByLabelText('Enter ingredient'));
        await user.keyboard('{4}{ }');
        await user.click(await screen.findByText('teaspoons'));
        await user.click(await screen.findByText('apples'));
        await user.click(await screen.findByText('diced'));
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('4 tsp apples, diced')).not.toBeNull();
    });
});
