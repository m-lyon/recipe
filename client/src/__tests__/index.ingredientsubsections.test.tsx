import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterCreateNewRecipePage } from '@recipe/utils/tests';
import { notNullByText, nullByText, renderComponent } from '@recipe/utils/tests';
import { clickFindByText, enterEditRecipePage, haveValueByLabelText } from '@recipe/utils/tests';
import { mockUpdateRecipeAddIngredientSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeEditIngredientSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveIngredientSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';

loadErrorMessages();
loadDevMessages();

describe('Ingredient Subsections', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display the ingredient subsections', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        await user.click(screen.getByLabelText('View Mock Recipe'));

        // Expect
        await notNullByText(screen, 'Instruction one', 'Section One', 'Section Two');
    });

    it('should add a new ingredient subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddIngredientSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 3'));
        await user.keyboard('New Section');
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 3'));
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
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Two');
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 3', 'New Section');
        expect(screen.queryByLabelText('Enter title for subsection 4')).not.toBeNull();
    });

    it('should edit an ingredient subsection name', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeEditIngredientSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 2'));
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
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Four');
    });

    it('should remove an ingredient subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveIngredientSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Two');
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
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        await nullByText(screen, 'Section Two', '⅓ cup apples, diced', '1 oz apples');
    });

    it('should add one new empty ingredient subsection after writing title and entering', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('New Section{Enter}');

        // Expect ------------------------------------------------
        haveValueByLabelText(screen, 'Enter title for subsection 1', 'New Section');
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
    });

    it('should add one new empty ingredient subsection after writing title and clicking', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('New Section');
        await user.click(screen.getByLabelText('Enter ingredient for subsection 3'));

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'New Section');
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
    });

    it('should have exactly one ingredient subsection, with an empty name', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        enterEditRecipePage('Mock Recipe Three', 'Instruction one', screen, user);

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', '');
        expect(screen.queryByLabelText('1 tsp apple, diced')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).toBeNull();
    });

    it('should have exactly two ingredient subsections, one empty', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        enterEditRecipePage('Mock Recipe Four', 'Instr #1.', screen, user);

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        expect(screen.queryByLabelText('1 tsp mock recipe two')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', '');
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
    });

    it('should have three ingredient subsections, one empty', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        expect(screen.queryByLabelText('1 tsp mock recipe two')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Two');
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 4')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 4')).toBeNull();
    });

    it('should keep ingredient list items after removing only subsection name, enter', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        enterEditRecipePage('Mock Recipe Four', 'Instr #1.', screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>13/}{Enter}');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', '');
        expect(screen.queryByLabelText('1 tsp mock recipe two')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
    });

    it('should keep ingredient list items after removing only subsection name, click', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        enterEditRecipePage('Mock Recipe Four', 'Instr #1.', screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>13/}');
        await user.click(screen.getByLabelText('Edit recipe title'));

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', '');
        expect(screen.queryByLabelText('1 tsp mock recipe two')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
    });

    it('should delete ingredient list items after removing first subsection name, enter', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>11/}{Enter}');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section Two');
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
        nullByText(screen, '2 tsp apple, diced', '1 apple, diced', '2 apples, diced');
        notNullByText(screen, '⅓ cup apples, diced', '1 oz apples');
    });

    it('should delete ingredient list items after removing first subsection name, click', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>11/}');
        await user.click(screen.getByLabelText('Edit recipe title'));

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section Two');
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
        nullByText(screen, '2 tsp apple, diced', '1 apple, diced', '2 apples, diced');
        notNullByText(screen, '⅓ cup apples, diced', '1 oz apples');
    });
});
