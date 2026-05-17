import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { enterViewRecipePage, haveValueByLabelText } from '@recipe/utils/tests';
import { mockArchiveRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockArchiveRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetArchivedRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUnarchiveRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockArchiveRecipeOneInUseError } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

vi.mock('@recipe/features/editing', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@recipe/features/editing')>();

    return {
        ...actual,
        ConfirmArchiveModal: ({ show, onConfirm }: { show: boolean; onConfirm: () => void }) => {
            if (!show) {
                return null;
            }

            return (
                <button type='button' aria-label='Confirm archive action' onClick={onConfirm}>
                    Confirm archive action
                </button>
            );
        },
    };
});

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

    it('should show notification when archive fails because recipe is used as ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockArchiveRecipeOneInUseError]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Archive Mock Recipe'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Archive failed')).not.toBeNull();
        expect(
            await screen.findByText(
                'Cannot delete recipe as it is currently being used in other existing recipes.'
            )
        ).not.toBeNull();
        // Recipe card should still be visible (cache not corrupted)
        expect(screen.getByLabelText('View Mock Recipe')).not.toBeNull();
    });

    it('should keep archived view after resetting search', async () => {
        // Render -----------------------------------------------
        // mockGetArchivedRecipes x2 for toggling archived (dual useSearch),
        // x1 for the reset which should re-query archived recipes.
        // mockGetRecipes is provided to catch the buggy scenario where reset
        // queries with { archived: false } — if consumed, non-archived
        // recipes would replace the archived view.
        renderComponent([
            mockGetArchivedRecipes,
            mockGetArchivedRecipes,
            mockGetArchivedRecipes,
            mockGetRecipes,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');

        // Toggle to archived view
        await user.click(screen.getByLabelText('Toggle archived recipes view'));
        expect(await screen.findByLabelText('View Mock Recipe Two')).not.toBeNull();

        // Focus search input to reveal the X (Reset search) button
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.click(screen.getByLabelText('Reset search'));

        // Expect ------------------------------------------------
        // Search field should be cleared
        haveValueByLabelText(screen, 'Search for recipes', '');
        // Archived recipes should still be displayed, not the non-archived ones.
        // If the bug is present, reset() queries { archived: false } which
        // returns 4 non-archived recipes (mockRecipeOne..Four), replacing
        // the 2 archived recipes.
        expect(await screen.findByLabelText('View Mock Recipe Two')).not.toBeNull();
        await waitFor(() => {
            expect(screen.queryByLabelText('View Mock Recipe Three')).toBeNull();
        });
        expect(screen.queryByLabelText('View Mock Recipe Four')).toBeNull();
    });
});
