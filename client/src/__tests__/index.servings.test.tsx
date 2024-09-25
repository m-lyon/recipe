import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { haveTextContentByLabelText } from '@recipe/utils/tests';
import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeNumServings } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Servings', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update the servings', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeNumServings]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        await user.click(screen.getByLabelText('Increase serving size'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', '5 Servings');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        expect(await screen.findByText('5 Servings')).not.toBeNull();
    });

    it('should perform 1-5 digit rounding', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        await user.click(screen.getByLabelText('Increase serving size'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        haveTextContentByLabelText(screen, 'Ingredient #4 in subsection 1', '1.41 oz apples');
    });

    it('should perform 5-25 digit rounding', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        await user.click(screen.getByLabelText('Increase serving size'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        haveTextContentByLabelText(screen, 'Ingredient #5 in subsection 1', '6.3 oz apples');
    });

    it('should perform 25-100 digit rounding', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        await user.click(screen.getByLabelText('Increase serving size'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        haveTextContentByLabelText(screen, 'Ingredient #6 in subsection 1', '32.5 oz apples');
    });

    it('should perform 100-250 digit rounding', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        await user.click(screen.getByLabelText('Increase serving size'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        haveTextContentByLabelText(screen, 'Ingredient #7 in subsection 1', '126 oz apples');
    });

    it('should perform 250+ digit rounding', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one');
        await user.click(screen.getByLabelText('Increase serving size'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        haveTextContentByLabelText(screen, 'Ingredient #8 in subsection 1', '315 oz apples');
    });
});
