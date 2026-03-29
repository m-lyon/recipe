import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { MockedResponses, enterViewRecipePage, renderPage } from '@recipe/utils/tests';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetRecipeOne, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetIngredientAndRecipeIngredients } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockCurrentUser, mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockCurrentUserNull } from '@recipe/graphql/queries/__mocks__/user';

import { routes } from '../routes';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mockedResponses: MockedResponses = []) => {
    return renderPage(
        routes,
        [
            mockGetRecipes,
            mockGetTags,
            mockGetIngredientAndRecipeIngredients,
            mockGetUnitConversions,
            ...mockedResponses,
        ],
        [PATH.ROOT]
    );
};

describe('View Recipe Edit Button — admin user', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show the edit button when logged in as admin', async () => {
        renderComponent([mockCurrentUserAdmin, mockGetRecipeOne]);
        const user = userEvent.setup();
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(await screen.findByLabelText('Edit Mock Recipe')).not.toBeNull();
    });
});

describe('View Recipe Edit Button — non-admin owner', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show the edit button for a non-admin owner', async () => {
        // mockCurrentUser has _id: mockUserId, mockRecipeTwo.owner is mockUserId
        // mockRecipeTwo has isIngredient: true, pluralTitle: 'Mock Recipes Two', numServings: 3
        // so the displayed title is the pluralTitle
        renderComponent([mockCurrentUser, mockGetRecipeTwo]);
        const user = userEvent.setup();
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
        expect(await screen.findByLabelText('Edit Mock Recipes Two')).not.toBeNull();
    });
});

describe('View Recipe Edit Button — not logged in', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show the edit button when not logged in', async () => {
        renderComponent([mockCurrentUserNull, mockGetRecipeOne]);
        const user = userEvent.setup();
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByLabelText('Edit Mock Recipe')).toBeNull();
    });
});

describe('View Recipe Edit Button — non-owner user', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show the edit button for a non-owner user', async () => {
        // mockCurrentUser has _id: mockUserId, mockRecipeOne.owner is mockAdminId
        renderComponent([mockCurrentUser, mockGetRecipeOne]);
        const user = userEvent.setup();
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByLabelText('Edit Mock Recipe')).toBeNull();
    });
});

describe('View Recipe Edit Button — navigation', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to the edit recipe page when the edit button is clicked', async () => {
        renderComponent([
            mockCurrentUserAdmin,
            mockGetRecipeOne,
            mockGetRecipeOne,
            mockGetIngredientComponents,
            mockGetUnitConversions,
        ]);
        const user = userEvent.setup();
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(await screen.findByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
    });
});
