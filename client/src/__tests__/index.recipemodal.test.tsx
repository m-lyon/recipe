import { afterEach, describe, it, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { notNullByText, nullByText } from '@recipe/utils/tests';
import { mockGetRecipeFour } from '@recipe/graphql/queries/__mocks__/recipe';
import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockGetRatingsRecipeFour } from '@recipe/graphql/queries/__mocks__/rating';
import { mockUpdateRecipeEditAsIngredient } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Recipe Modal', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display the recipe ingredient modal', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        nullByText(screen, 'Section One', '2 apples, diced', 'Instruction one');
        await user.click(screen.getByLabelText('View Mock Recipe Two'));

        // Expect ------------------------------------------------
        await notNullByText(screen, 'Section One', '2 apples, diced', 'Instruction one');
    });

    it('should display an updated recipe ingredient modal', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
        renderComponent([
            mockUpdateRecipeEditAsIngredient,
            mockGetRecipeFour,
            mockGetRatingsRecipeFour,
        ]);
        const user = userEvent.setup();

        // ------ Initial View Recipe Page -----------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        nullByText(screen, 'Section One', '2 apples, diced');
        await user.click(screen.getByLabelText('View Mock Recipe Two'));
        await notNullByText(screen, '2 apples, diced');
        await user.click(screen.getByLabelText('Close Mock Recipe Two modal'));
        await user.click(screen.getByLabelText('Navigate to home page'));

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 2'));
        await user.keyboard('Two');
        await user.click(screen.getByLabelText('Remove 1 oz apples'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        nullByText(screen, 'Section One', '2 apples, diced', 'Section TwoTwo');
        await user.click(screen.getByLabelText('View Mock Recipe Two'));
        await notNullByText(screen, '2 apples, diced');
        await notNullByText(screen, 'Instruction one', 'Section TwoTwo');
        nullByText(screen, 'Section Two', '1 oz apples');
    });
});
