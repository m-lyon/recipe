import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterCreateNewRecipePage } from '@recipe/utils/tests';
import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
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
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Remove lunch tag'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByText('dinner')).not.toBeNull();
        expect(screen.queryByText('lunch')).toBeNull();
    });

    it('should add a new tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddNewTag, mockCreateTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('mock tag{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByText('dinner')).not.toBeNull();
        expect(screen.queryAllByText('mock tag')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByText('dinner')).not.toBeNull();
        expect(screen.queryAllByText('mock tag')).not.toBeNull();
    });

    it('should add an existing tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddExistingTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Add a tag'));
        await user.click(await screen.findByText('spicy'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('dinner')).not.toBeNull();
        expect(screen.queryByText('spicy')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByText('dinner')).not.toBeNull();
        expect(screen.queryAllByText('spicy')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByText('dinner')).not.toBeNull();
        expect(screen.queryAllByText('spicy')).not.toBeNull();
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
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('mock tag{Enter}');
        await user.click(screen.getByLabelText('Navigate to home page'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);

        // Expect ------------------------------------------------
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).not.toBeNull();
    });

    it('should remove a new tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateTag, mockRemoveTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('mock tag{Enter}');
        await user.click(await screen.findByLabelText('Remove mock tag tag'));
        await user.click(screen.getByLabelText('Navigate to home page'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        await user.click(screen.getByLabelText('Add a tag'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Add a tag'));
        expect(await screen.findByText('dinner')).not.toBeNull();
        expect(screen.queryByText('mock tag')).toBeNull();
    });

    it('should show a warning for a reserved ingredient tag', async () => {
        // Render -----------------------------------------------
        renderComponent([]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('{v}{e}{g}{a}{n}');

        // Expect ------------------------------------------------
        expect(await screen.findByText('Reserved tag')).not.toBeNull();
        expect(
            await screen.findByText('vegan tag is automatically determined from ingredients.')
        ).not.toBeNull();
    });
    it('should show a warning for a reserved recipe tag', async () => {
        // Render -----------------------------------------------
        renderComponent([]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Add a tag'));
        await user.keyboard('{i}{n}{g}{r}{e}{d}{i}{e}{n}{t}');

        // Expect ------------------------------------------------
        expect(await screen.findByText('Reserved tag')).not.toBeNull();
        expect(await screen.findByText('ingredient is a reserved tag.')).not.toBeNull();
    });
});
