import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, screen, waitForElementToBeRemoved } from '@testing-library/react';

import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesFilteredTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCountRecipesFilteredTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { enterViewRecipePage, haveValueByLabelText, notNullByLabelText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Search Functionality', () => {
    afterEach(() => {
        cleanup();
    });

    it('should reset search form when clicking on home button', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesFilteredTwo, mockCountRecipesFilteredTwo, mockGetRecipes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Navigate to home page'));

        // Expect ------------------------------------------------
        haveValueByLabelText(screen, 'Search for recipes', '');
        await notNullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Two');
    });

    it('should reset search form when navigating back to home', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesFilteredTwo, mockCountRecipesFilteredTwo, mockGetRecipes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Navigate to home page'));

        // Expect ------------------------------------------------
        haveValueByLabelText(screen, 'Search for recipes', '');
        await notNullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Two');
    });
});
