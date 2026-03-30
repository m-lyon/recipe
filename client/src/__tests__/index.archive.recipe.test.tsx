import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterViewRecipePage } from '@recipe/utils/tests';
import { mockArchiveRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockArchiveRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetArchivedRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUnarchiveRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Archive Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should archive a recipe only', async () => {
        // Render -----------------------------------------------
        renderComponent([mockArchiveRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Archive Mock Recipe'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe')).toBeNull();
    });

    it('should archive a recipe that is an ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockArchiveRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Archive Mock Recipe Two'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe Two')).toBeNull();

        // ------ Ingredient List --------------------------------
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await user.click(await screen.findByText('skip unit'));
        expect(screen.queryByText('mock recipes two')).toBeNull();
    });

    it('should archive a recipe after viewing', async () => {
        // Render -----------------------------------------------
        renderComponent([mockArchiveRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Archive Mock Recipe'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe')).toBeNull();
    });

    it('should toggle to archived view and unarchive a recipe', async () => {
        // Render -----------------------------------------------
        // mockGetArchivedRecipes is provided twice because both Navbar and
        // RecipeCardsContainer call useSearch(), each triggering a search
        // when showArchived toggles.
        renderComponent([mockGetArchivedRecipes, mockGetArchivedRecipes, mockUnarchiveRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        expect(screen.getByText('Mock Recipe')).not.toBeNull();

        // Toggle archived view
        await user.click(screen.getByLabelText('Toggle archived recipes view'));

        // Wait for archived recipes to load (mockArchivedRecipeTwo is
        // isIngredient with numServings > 1, so card title is pluralTitle)
        expect(await screen.findByLabelText('View Mock Recipe Two')).not.toBeNull();

        // Hover and unarchive
        await user.hover(screen.getByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Unarchive Mock Recipe'));

        // Expect ------------------------------------------------
        await waitFor(() => {
            expect(screen.queryByLabelText('View Mock Recipe')).toBeNull();
        });
        expect(screen.getByLabelText('View Mock Recipe Two')).not.toBeNull();
    });
});
