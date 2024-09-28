import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, fireEvent, screen, waitForElementToBeRemoved } from '@testing-library/react';

import { Navbar } from '@recipe/features/navbar';
import { mockCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipesLarger } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCountRecipesLarger } from '@recipe/graphql/queries/__mocks__/recipe';
import { MockedResponses, nullByLabelText, renderPage } from '@recipe/utils/tests';
import { mockGetRecipesLargerFilteredTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCountRecipesLargerFilteredOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCountRecipesLargerFilteredTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesLargerFilteredOnePageOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesLargerFilteredOnePageTwo } from '@recipe/graphql/queries/__mocks__/recipe';

import { Home } from '../Home';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(
        <Route path='/' element={<Navbar />}>
            <Route index element={<Home />} />
        </Route>
    );
    renderPage(routes, [mockCurrentUser, mockGetRecipesLarger, mockCountRecipesLarger, ...mocks]);
};

describe('Search Functionality', () => {
    afterEach(() => {
        cleanup();
    });
    it('should repopulate recipe card list with only relevant cards', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesLargerFilteredTwo, mockCountRecipesLargerFilteredTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));

        // Expect -----------------------------------------------
        nullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Three');
        expect(screen.queryAllByLabelText('View Mock Recipe Two')).toHaveLength(2);
    });
    it('should limit scrolldown pagination correctly after search, no more pages', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipesLargerFilteredTwo, mockCountRecipesLargerFilteredTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));
        fireEvent.scroll(window, { target: { scrollY: 100 } });

        // Expect -----------------------------------------------
        expect(screen.queryByText('Loading...')).toBeNull();
        nullByLabelText(screen, 'View Mock Recipe', 'View Mock Recipe Three');
        expect(screen.queryAllByLabelText('View Mock Recipe Two')).toHaveLength(2);
    });
    it('should limit scrolldown pagination correctly after search, one more page', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockGetRecipesLargerFilteredOnePageOne,
            mockGetRecipesLargerFilteredOnePageTwo,
            mockCountRecipesLargerFilteredOne,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('one');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe Two'));
        fireEvent.scroll(window, { target: { scrollY: 100 } });
        expect(screen.queryByText('Loading...')).not.toBeNull();
        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

        // Expect -----------------------------------------------
        nullByLabelText(screen, 'View Mock Recipe Two', 'View Mock Recipe Three');
        expect(screen.queryAllByLabelText('View Mock Recipe')).toHaveLength(9);
    });
    it('should reset card list after blank search term', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockGetRecipesLarger,
            mockGetRecipesLargerFilteredTwo,
            mockCountRecipesLargerFilteredTwo,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await screen.findAllByLabelText('View Mock Recipe');
        await user.click(screen.getByLabelText('Search for recipes'));
        await user.keyboard('two');
        await waitForElementToBeRemoved(() => screen.queryAllByLabelText('View Mock Recipe'));
        await user.keyboard('{Backspace>3/}');

        // Expect -----------------------------------------------
        expect(await screen.findAllByLabelText('View Mock Recipe')).toHaveLength(2);
        expect(screen.queryByLabelText('View Mock Recipe Three')).not.toBeNull();
        expect(screen.queryAllByLabelText('View Mock Recipe Two')).toHaveLength(2);
    });
});
