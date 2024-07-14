import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockCreateTag, mockRemoveTag } from '@recipe/graphql/mutations/__mocks__/tag';
import { mockUpdateRecipeRemoveTag } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeAddNewTag } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeAddExistingTag } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Tags', () => {
    afterEach(() => {
        cleanup();
    });

    it('should remove a tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Remove lunch tag'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
    });

    it('should add a new tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddNewTag, mockCreateTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('mock tag{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
    });

    it('should add an existing tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddExistingTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        await user.click(await screen.findByText('spicy'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('spicy')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('spicy')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('spicy')).not.toBeNull();
    });
});

describe('Tag Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should create a new tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        expect(await screen.findByText('Logout'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Ingredients')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('mock tag{Enter}');
        await user.click(screen.getByLabelText('Navigate to home page'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);

        // Expect ------------------------------------------------
        expect(await screen.findByText('Ingredients')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
    });

    it('should remove a new tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateTag, mockRemoveTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        expect(await screen.findByText('Logout'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Ingredients')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('mock tag{Enter}');
        await user.click(screen.getByLabelText('Remove mock tag tag'));
        await user.click(screen.getByLabelText('Navigate to home page'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        await user.click(screen.getByLabelText('Add a tag'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Ingredients')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).toBeNull();
    });
});
