import userEvent from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeCalculatedTagsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeCalculatedTagsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeCalculatedTagsRemove } from '@recipe/graphql/mutations/__mocks__/recipe';

import { enterEditRecipePage, renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Calculated Tags', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add a new calculated tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsAdd]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('vegetarian')).not.toBeNull();
        expect(screen.queryByText('special')).not.toBeNull();
        expect(screen.queryByText('vegan')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('vegetarian')).not.toBeNull();
        expect(screen.queryByText('special')).not.toBeNull();
        expect(screen.queryByText('vegan')).not.toBeNull();
    });

    it('should display edit calculated tags', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('vegetarian')).not.toBeNull();
        expect(screen.queryByText('special')).not.toBeNull();
        expect(screen.queryByText('vegan')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('vegetarian')).not.toBeNull();
        expect(screen.queryByText('special')).not.toBeNull();
        expect(screen.queryByText('vegan')).toBeNull();
    });

    it('should remove a calculated tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeCalculatedTagsRemove]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('vegetarian')).not.toBeNull();
        expect(screen.queryByText('vegan')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('vegetarian')).not.toBeNull();
        expect(screen.queryByText('vegan')).toBeNull();
    });
});
