import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import createFetchMock from 'vitest-fetch-mock';

import { PATH } from '@recipe/constants';
import { renderPage } from '@recipe/utils/tests';
import { getMockedImageBlob } from '@recipe/utils/tests';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCurrentUserNull } from '@recipe/graphql/queries/__mocks__/user';
import { mockLogin, mockLogout } from '@recipe/graphql/mutations/__mocks__/user';
import { mockArchiveRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
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
        renderComponent([mockCurrentUserNull, mockLogin]);
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
            mockGetUnitConversions,
            mockLogout,
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
            mockGetUnitConversions,
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
