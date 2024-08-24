import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { notNullByText, nullByText, renderComponent } from '@recipe/utils/tests';
import { mockUpdateRecipeAddSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeEditSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { clickFindByText, enterEditRecipePage, haveValueByLabelText } from '@recipe/utils/tests';

loadErrorMessages();
loadDevMessages();

describe('Recipe Subsections', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display the recipe subsections', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        await user.click(screen.getByLabelText('View Mock Recipe'));

        // Expect
        await notNullByText(screen, 'Instruction one', 'Section One', 'Section Two');
    });

    it('should add a new subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter title for subsection 3'));
        await user.keyboard('New Section');
        await user.click(screen.getByLabelText('Enter ingredient for subsection 3'));
        await user.keyboard('{5}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'Section One', 'Section Two', 'New Section');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        haveValueByLabelText(screen, 'Enter title for subsection 1', 'Section One');
        haveValueByLabelText(screen, 'Enter title for subsection 2', 'Section Two');
        haveValueByLabelText(screen, 'Enter title for subsection 3', 'New Section');
        expect(screen.queryByLabelText('Enter title for subsection 4')).not.toBeNull();
    });

    it('should edit a subsection name', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeEditSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter title for subsection 2'));
        await user.keyboard('{Backspace>3/}Four');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'Section One', 'Section Four');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        haveValueByLabelText(screen, 'Enter title for subsection 1', 'Section One');
        haveValueByLabelText(screen, 'Enter title for subsection 2', 'Section Four');
    });

    it('should remove a subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        haveValueByLabelText(screen, 'Enter title for subsection 2', 'Section Two');
        await notNullByText(screen, '⅓ cup apples, diced', '1 oz apples');
        await user.click(screen.getByLabelText('Enter title for subsection 2'));
        await user.keyboard('{Backspace>11/}{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        await notNullByText(screen, 'Instruction one', 'Section One');
        await nullByText(screen, 'Section Two', '⅓ cup apples, diced', '1 oz apples');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        haveValueByLabelText(screen, 'Enter title for subsection 1', 'Section One');
        await nullByText(screen, 'Section Two', '⅓ cup apples, diced', '1 oz apples');
    });
});
