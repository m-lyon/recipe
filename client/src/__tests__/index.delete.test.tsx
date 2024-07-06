import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockCreateRecipe, mockDeleteRecipe } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Delete Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should delete a recipe', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateRecipe, mockGetIngredients, mockDeleteRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Delete Mock Recipe'));
        await user.click(screen.getByLabelText('Confirm delete action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe')).toBeNull();
    });

    it('should delete a recipe after viewing', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateRecipe, mockGetIngredients, mockDeleteRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Delete Mock Recipe'));
        await user.click(screen.getByLabelText('Confirm delete action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe')).toBeNull();
    });
});
