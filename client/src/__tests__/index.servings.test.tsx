import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage } from '@recipe/utils/tests';
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
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('5 Servings')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');
        expect(await screen.findByText('5 Servings')).not.toBeNull();
    });
});
