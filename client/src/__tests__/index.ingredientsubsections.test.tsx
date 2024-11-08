import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { nullByText } from '@recipe/utils/tests';
import { mockGetRecipeFour } from '@recipe/graphql/queries/__mocks__/recipe';
import { clickFindByText, enterCreateNewRecipePage } from '@recipe/utils/tests';
import { mockGetRatingsRecipeFour } from '@recipe/graphql/queries/__mocks__/rating';
import { enterEditRecipePage, haveValueByLabelText, notNullByText } from '@recipe/utils/tests';
import { enterViewRecipePage, notNullByLabelText, nullByLabelText } from '@recipe/utils/tests';
import { mockUpdateRecipeAddIngredientSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeEditIngredientSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveIngredientSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

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
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect
        await notNullByText(screen, 'Section One', 'Section Two');
    });

    it('should add a new ingredient subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddIngredientSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 3'));
        await user.keyboard('New Section');
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 3'));
        await user.keyboard('{5}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Section One', 'Section Two', 'New Section');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        expect(screen.queryByLabelText('Enter ingredient #4 for subsection 1')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Two');
        expect(screen.queryByLabelText('Enter ingredient #3 for subsection 2')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 3', 'New Section');
        expect(screen.queryByLabelText('Enter ingredient #2 for subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 4')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 4')).not.toBeNull();
    });

    it('should edit an ingredient subsection name', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeEditIngredientSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 2'));
        await user.keyboard('{Backspace>3/}Four');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Section One', 'Section Four');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        expect(screen.queryByLabelText('Enter ingredient #4 for subsection 1')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Four');
        expect(screen.queryByLabelText('Enter ingredient #3 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).not.toBeNull();
    });

    it('should remove an ingredient subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveIngredientSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Two');
        await notNullByLabelText(screen, '⅓ cup medium apples, diced', '1 oz apples');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 2'));
        await user.keyboard('{Backspace>11/}{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await notNullByText(screen, 'Section One');
        nullByText(screen, 'Section Two', '⅓ cup medium apples, diced', '1 oz apples');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        expect(screen.queryByLabelText('Enter ingredient #4 for subsection 1')).not.toBeNull();
        nullByText(screen, 'Section Two');
        nullByLabelText(screen, '⅓ cup medium apples, diced', '1 oz apples');
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).not.toBeNull();
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
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'New Section');
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
        await user.click(screen.getByLabelText('Enter recipe title'));

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
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', '');
        expect(screen.queryByLabelText('1 tsp apples, diced')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).toBeNull();
    });

    it('should have exactly two ingredient subsections, one empty', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'First Section');
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
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section One');
        expect(screen.queryByLabelText('Enter ingredient #4 for subsection 1')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 2', 'Section Two');
        expect(screen.queryByLabelText('Enter ingredient #3 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 4')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 4')).toBeNull();
    });

    it('should keep ingredient list items after removing only subsection name, enter', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>13/}{Enter}');
        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).toBeNull()
        );
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', '');
        expect(screen.queryByLabelText('1 tsp mock recipe two')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
    });

    it('should keep ingredient list items after removing only subsection name, click', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>13/}');
        await user.click(screen.getByLabelText('Enter recipe title'));

        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).toBeNull()
        );
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', '');
        expect(screen.queryByLabelText('1 tsp mock recipe two')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
    });

    it('should delete ingredient list items after removing first subsection name, enter', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>11/}{Enter}');

        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull()
        );
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section Two');
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
        nullByLabelText(screen, '2 tsp apple, diced', '1 apple, diced', '2 apples, diced');
        await notNullByLabelText(screen, '⅓ cup medium apples, diced', '1 oz apples');
    });

    it('should delete ingredient list items after removing first subsection name, click', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.keyboard('{Backspace>11/}');
        await user.click(screen.getByLabelText('Enter recipe title'));

        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(screen.queryByLabelText('Enter title for ingredient subsection 3')).toBeNull()
        );
        haveValueByLabelText(screen, 'Enter title for ingredient subsection 1', 'Section Two');
        expect(screen.queryByLabelText('Enter title for ingredient subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter ingredient #1 for subsection 3')).toBeNull();
        nullByLabelText(screen, '2 tsp apple, diced', '1 apple, diced', '2 apples, diced');
        await notNullByLabelText(screen, '⅓ cup medium apples, diced', '1 oz apples');
    });

    it('should stop recipe submission if there is a second non-named ingredient subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 2'));
        await user.keyboard('{6}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(
                screen.queryByText('Please enter a name for each ingredient subsection')
            ).not.toBeNull()
        );
    });

    it('should stop recipe submission if there is a second named subsection with no ingredients', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 2'));
        await user.keyboard('Second Section');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(
                screen.queryByText('Please enter at least one ingredient for each subsection')
            ).not.toBeNull()
        );
    });
});
