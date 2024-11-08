import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { clickFindByText, notNullByLabelText, notNullByText } from '@recipe/utils/tests';
import { mockUpdateRecipeIngredientsAdd } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeIngredientsEdit } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeIngredientsRemove } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Ingredients', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add an ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeIngredientsAdd]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter ingredient #3 for subsection 2'));
        await user.keyboard('{4}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        expect(await screen.findByLabelText('4 tsp apples, diced')).not.toBeNull();
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', '1 small apple, diced');
        await notNullByText(screen, '4 tsp apples, diced', '2 apples, diced');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByLabelText(screen, '1 small apple, diced', '4 tsp apples, diced');
        await notNullByLabelText(screen, '2 apples, diced');
    });

    it('should edit the ingredients', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeIngredientsEdit]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Remove 2 apples, diced'));
        await user.click(screen.getByLabelText('Enter ingredient #3 for subsection 1'));
        await user.keyboard('{4}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        expect(await screen.findByLabelText('4 tsp apples, diced')).not.toBeNull();
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, '1 small apple, diced', '4 tsp apples, diced');
        expect(screen.queryByText('2 apples, diced')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByLabelText(screen, '1 small apple, diced', '4 tsp apples, diced');
        expect(screen.queryByLabelText('2 apples, diced')).toBeNull();
    });

    it('should remove an ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeIngredientsRemove]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Remove 2 apples, diced'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', '1 small apple, diced');
        expect(screen.queryByText('2 apples, diced')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(await screen.findByLabelText('1 small apple, diced')).not.toBeNull();
        expect(screen.queryByLabelText('2 apples, diced')).toBeNull();
    });
});
