import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockLogin, mockLogout } from '@recipe/graphql/mutations/__mocks__/user';
import { MockedResponses, enterViewRecipePage, renderPage } from '@recipe/utils/tests';
import { mockCurrentUser, mockCurrentUserNull } from '@recipe/graphql/queries/__mocks__/user';
import { mockCountRecipes, mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';

const renderComponent = (mockedResponses: MockedResponses = []) => {
    renderPage(routes, [mockGetRecipes, mockCountRecipes, ...mockedResponses], [PATH.ROOT]);
};

loadErrorMessages();
loadDevMessages();

describe('Auth Workflow', () => {
    afterEach(() => {
        cleanup();
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
        renderComponent([mockCurrentUser, mockGetRecipeOne, mockLogout]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        enterViewRecipePage(screen, user, 'Recipe One', 'Instruction one');
        await user.click(screen.getByLabelText('Logout'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByLabelText('Logout')).toBeNull();
        expect(screen.queryByLabelText('Log in or sign up')).not.toBeNull();
    });
});
