import { afterEach, describe, it, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockGetRecipeFourById } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRatingsRecipeTwo } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeFour } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeFive } from '@recipe/graphql/queries/__mocks__/rating';
import { MockedResponses, notNullByText, nullByText, renderPage } from '@recipe/utils/tests';
import { mockUpdateRecipeEditAsIngredient } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipeTwo, mockGetRecipeTwoById } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeFour, mockGetRecipesExtra } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCountRecipesExtra, mockGetRecipeFive } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';
import { mocksMinimal } from '../__mocks__/graphql';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mockedResponses: MockedResponses = []) => {
    return renderPage(
        routes,
        [
            ...mocksMinimal,
            mockGetRecipesExtra,
            mockCountRecipesExtra,
            mockGetRecipeTwoById,
            ...mockedResponses,
        ],
        [PATH.ROOT]
    );
};

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
        nullByText(screen, 'Section One', '2 apples, diced', 'Instruction one.');
        await user.click(screen.getByLabelText('View Mock Recipe Two'));

        // Expect ------------------------------------------------
        await notNullByText(screen, 'Section One', '2 apples, diced', 'Instruction one.');
    });

    it('should display an updated recipe ingredient modal', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
        renderComponent([
            mockGetRecipeFour,
            mockGetRatingsRecipeFour,
            mockGetRecipeTwo,
            mockGetRatingsRecipeTwo,
            mockUpdateRecipeEditAsIngredient,
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
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
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
        await notNullByText(screen, 'Instruction one.', 'Section TwoTwo');
        nullByText(screen, 'Section Two', '1 oz apples');
    });

    it('should display a nested recipe ingredient modal', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFive, mockGetRatingsRecipeFive, mockGetRecipeFourById]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Five', 'Instr #3.');
        nullByText(screen, 'Section One', '2 apples, diced', 'Instruction one.');
        nullByText(screen, 'Instr #1.', '1 tsp mock recipe two');
        await user.click(screen.getByLabelText('View Mock Recipe Four'));
        await notNullByText(screen, 'Instr #1.', '1 tsp mock recipe two');
        await user.click(screen.getByLabelText('View Mock Recipe Two'));

        // Expect ------------------------------------------------
        await notNullByText(screen, 'Section One', '2 apples, diced', 'Instruction one.');
    });
});
