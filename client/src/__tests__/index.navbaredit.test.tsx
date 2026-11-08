import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockZeroLinkedRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { MockedResponses, enterViewRecipePage, renderPage } from '@recipe/utils/tests';
import { mockGetDisplayLadders } from '@recipe/graphql/queries/__mocks__/displayLadder';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetIngredientAndRecipeIngredients } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';
import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

const renderAsUser = (mockedResponses: MockedResponses) => {
    return renderPage(
        routes,
        [
            mockCurrentUser,
            mockGetTags,
            mockGetRecipes,
            mockGetIngredientAndRecipeIngredients,
            mockGetDisplayLadders,
            ...mockedResponses,
        ],
        [PATH.ROOT]
    );
};

describe('Navbar Edit on the view recipe page', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to the edit page of the recipe being viewed', async () => {
        // Render -----------------------------------------------
        // The edit page fetches the recipe again
        const { router } = renderComponent([mockGetRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByRole('link', { name: 'Edit' }));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Save')).not.toBeNull();
        expect(router.state.location.pathname).toBe(`${PATH.BASE}/edit/recipe/mock-recipe-one`);
    });

    it('should link to the recipe for its owner', async () => {
        // Render -----------------------------------------------
        renderAsUser([mockGetRecipeTwo, mockZeroLinkedRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');

        // Expect ------------------------------------------------
        // One entry each in the desktop and mobile navs
        expect(screen.getAllByLabelText('Edit this recipe')).toHaveLength(2);
    });

    it('should not link to the recipe for a user who does not own it', async () => {
        // Render -----------------------------------------------
        renderAsUser([mockGetRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect ------------------------------------------------
        expect(screen.queryAllByLabelText('Edit this recipe')).toHaveLength(0);
        expect(screen.getByRole('link', { name: 'Edit' }).getAttribute('href')).not.toContain(
            '/edit/recipe'
        );
    });
});
