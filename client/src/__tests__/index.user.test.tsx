import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import createFetchMock from 'vitest-fetch-mock';

import { PATH } from '@recipe/constants';
import { renderPage } from '@recipe/utils/tests';
import { getMockedImageBlob } from '@recipe/utils/tests';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCurrentUserNull } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetEditableUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockLogin, mockLogout } from '@recipe/graphql/mutations/__mocks__/user';
import { mockArchiveRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetDisplayLadders } from '@recipe/graphql/queries/__mocks__/displayLadder';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCurrentUser, mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { MockedResponses, enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockGetIngredientAndRecipeIngredients } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';

const renderComponent = (mockedResponses: MockedResponses = []) => {
    return renderPage(
        routes,
        [mockGetRecipes, mockGetTags, mockGetIngredientAndRecipeIngredients, ...mockedResponses],
        [PATH.ROOT]
    );
};

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

loadErrorMessages();
loadDevMessages();

describe('Auth Workflow', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('should log in', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockCurrentUserNull,
            mockLogin,
            // Logging in refetches the queries on screen
            mockCurrentUserAdmin,
            mockGetRecipes,
            mockGetTags,
            mockGetIngredientAndRecipeIngredients,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.click(screen.getByLabelText('Log in or sign up'));
        expect(await screen.findByText('Log In')).not.toBeNull();
        await user.click(screen.getByLabelText('Email'));
        await user.keyboard('test@gmail.com');
        await user.click(screen.getByLabelText('Password'));
        await user.keyboard('password');
        await user.click(screen.getByLabelText('Login'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByLabelText('Logout')).not.toBeNull();
    });

    it('should log out', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockCurrentUserAdmin,
            mockGetRecipeOne,
            mockGetDisplayLadders,
            mockLogout,
            // Logging out refetches the queries on screen
            mockCurrentUserNull,
            mockGetRecipeOne,
            mockGetDisplayLadders,
            mockGetRecipes,
            mockGetTags,
            mockGetIngredientAndRecipeIngredients,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Logout'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByLabelText('Logout')).toBeNull();
        expect(screen.queryByLabelText('Log in or sign up')).not.toBeNull();
    });

    it('should list the units of the new user after logging in as someone else', async () => {
        // Render -----------------------------------------------
        const mockGetEditableUnitsOfUser = {
            ...mockGetEditableUnits,
            result: { data: { __typename: 'Query' as const, unitManyEditable: [mockUnit] } },
        };
        // Logging in and out refetches the queries on screen, so some mocks are used more
        // than once. Each limit is the number of times the flow below sends that query.
        const { router } = renderPage(
            routes,
            [
                mockCurrentUser,
                mockGetEditableUnitsOfUser,
                mockLogout,
                mockCurrentUserNull,
                mockLogin,
                mockCurrentUserAdmin,
                // Refetched at logout while the page is still mounted, then the admin's visit
                { ...mockGetEditableUnits, maxUsageCount: 2 },
                // The unit form's query: first visit, refetch at logout, admin's visit
                { ...mockGetIngredientComponents, maxUsageCount: 3 },
                // The home page after logout, then the refetch at login
                { ...mockGetRecipes, maxUsageCount: 2 },
                { ...mockGetTags, maxUsageCount: 2 },
                // The search bar: once, or twice when still mounted at the refetch at login
                { ...mockGetIngredientAndRecipeIngredients, maxUsageCount: 2 },
            ],
            [`${PATH.BASE}/edit/unit`]
        );
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
        expect(await screen.findByRole('option', { name: 'cutting' })).not.toBeNull();
        await user.keyboard('{Escape}');
        await user.click(screen.getByLabelText('Logout'));
        await user.click(await screen.findByLabelText('Log in or sign up'));
        await user.click(await screen.findByLabelText('Email'));
        await user.keyboard('test@gmail.com');
        await user.click(screen.getByLabelText('Password'));
        await user.keyboard('password');
        await user.click(screen.getByLabelText('Login'));
        expect(await screen.findByLabelText('Logout')).not.toBeNull();
        await router.navigate(`${PATH.BASE}/edit/unit`);

        // Expect ------------------------------------------------
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
        expect(await screen.findByRole('option', { name: 'teaspoon' })).not.toBeNull();
    });
});

describe('Edit & Archive Permissions', () => {
    afterEach(() => {
        cleanup();
    });

    it('should allow non-admin owner to edit recipe', async () => {
        // Render -----------------------------------------------
        fetchMock.mockResponseOnce(getMockedImageBlob());
        renderComponent([
            mockCurrentUser,
            mockGetRecipeTwo,
            mockGetIngredientComponents,
            mockGetDisplayLadders,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));

        // Expect ------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
        expect(await screen.findByLabelText('Enter recipe title')).not.toBeNull();
    });

    it('should NOT allow non-admin non-owner to edit recipe', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCurrentUser, mockGetRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));

        // Expect ------------------------------------------------
        expect(screen.queryByLabelText('Edit Mock Recipe')).toBeNull();
    });

    it('should allow non-admin owner to archive recipe', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCurrentUser, mockArchiveRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Archive Mock Recipe Two'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe Two')).toBeNull();
    });

    it('should NOT allow non-admin non-owner to archive recipe', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCurrentUser, mockGetRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));

        // Expect ------------------------------------------------
        expect(screen.queryByLabelText('Archive Mock Recipe')).toBeNull();
    });
});
