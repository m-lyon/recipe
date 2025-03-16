import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, screen, waitForElementToBeRemoved } from '@testing-library/react';

import { nullByLabelText } from '@recipe/utils/tests';
import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesFilteredTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesFilteredTag } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesFilteredIngr } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesFilteredTagIngr } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesFilteredTwoTagIngr } from '@recipe/graphql/queries/__mocks__/recipe';
import { enterViewRecipePage, haveValueByLabelText, notNullByLabelText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Search Functionality', () => {
    afterEach(() => {
        cleanup();
    });

    it('should filter recipes by title', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesFilteredTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));

        // Expect ------------------------------------------------
        await notNullByLabelText(screen, 'View Mock Recipe Two');
    });

    it('should filter recipes by tag', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesFilteredTag]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Filter by tags'));
        await user.click(await screen.findByLabelText('Highlighted selection: dinner'));
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe Two'));

        // Expect ------------------------------------------------
        await notNullByLabelText(screen, 'View Mock Recipe');
        nullByLabelText(screen, 'View Mock Recipe Two', 'View Mock Recipe Three');
        nullByLabelText(screen, 'View Mock Recipe Four');
    });

    it('should filter recipes by ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesFilteredIngr]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Filter by ingredients'));
        await user.click(await screen.findByLabelText('carrot'));
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe Two'));

        // Expect ------------------------------------------------
        nullByLabelText(screen, 'View Mock Recipe Two', 'View Mock Recipe Three');
        nullByLabelText(screen, 'View Mock Recipe Four');
    });

    it('should reset search form when clicking on home button', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockGetRecipesFilteredTwo,
            mockGetRecipesFilteredTwoTagIngr,
            mockGetRecipes,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Filter by tags'));
        await user.click(await screen.findByLabelText('Highlighted selection: dinner'));
        await user.click(screen.getByLabelText('Filter by ingredients'));
        await user.click(await screen.findByLabelText('carrot'));
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Navigate to home page'));

        // Expect ------------------------------------------------
        haveValueByLabelText(screen, 'Search for recipes', '');
        await notNullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Two');
        nullByLabelText(screen, 'Remove dinner filter', 'Remove carrot filter');
    });

    it('should reset search form when clicking on reset button', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockGetRecipesFilteredTwo,
            mockGetRecipesFilteredTwoTagIngr,
            mockGetRecipes,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Filter by tags'));
        await user.click(await screen.findByLabelText('Highlighted selection: dinner'));
        await user.click(screen.getByLabelText('Filter by ingredients'));
        await user.click(await screen.findByLabelText('carrot'));
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Reset search'));

        // Expect ------------------------------------------------
        haveValueByLabelText(screen, 'Search for recipes', '');
        await notNullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Two');
        nullByLabelText(screen, 'Remove dinner filter', 'Remove carrot filter');
    });

    it('should reset search form when navigating back to home', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesFilteredTwo, mockGetRecipes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
        await user.click(screen.getByLabelText('Navigate to home page'));

        // Expect ------------------------------------------------
        haveValueByLabelText(screen, 'Search for recipes', '');
        await notNullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Two');
    });

    it('should reset when removing tag and ingredient filters', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipes, mockGetRecipesFilteredTagIngr]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Filter by tags'));
        await user.click(await screen.findByLabelText('Highlighted selection: dinner'));
        await user.click(screen.getByLabelText('Filter by ingredients'));
        await user.click(await screen.findByLabelText('carrot'));
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Remove dinner filter'));
        await user.click(screen.getByLabelText('Remove carrot filter'));

        // Expect ------------------------------------------------
        await notNullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Two');
        nullByLabelText(screen, 'Remove dinner filter', 'Remove carrot filter');
    });
});
