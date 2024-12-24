import createFetchMock from 'vitest-fetch-mock';
import { afterEach, describe, it, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { mockGetRecipeFourById } from '@recipe/graphql/queries/__mocks__/recipe';
import { MockedResponses, notNullByText, nullByText, renderPage } from '@recipe/utils/tests';
import { mockUpdateRecipeEditAsIngredient } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipeTwo, mockGetRecipeTwoById } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeFour, mockGetRecipesExtra } from '@recipe/graphql/queries/__mocks__/recipe';
import { enterEditRecipePage, enterViewRecipePage, getMockedImageBlob } from '@recipe/utils/tests';
import { mockCountRecipesExtra, mockGetRecipeFive } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';
import { mocksMinimal } from '../__mocks__/graphql';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

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
        renderComponent([mockGetRecipeFour]);
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
        fetchMock.mockResponseOnce(getMockedImageBlob());
        renderComponent([mockGetRecipeFour, mockGetRecipeTwo, mockUpdateRecipeEditAsIngredient]);
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
        renderComponent([mockGetRecipeFive, mockGetRecipeFourById]);
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
