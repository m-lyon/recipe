import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { mockGetRecipe } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockLinkedRecipesForRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { ViewRecipe } from '../ViewRecipe';

loadErrorMessages();
loadDevMessages();

const renderComponent = () => {
    const routes = createRoutesFromElements(<Route path='/' element={<ViewRecipe />} />);
    return renderPage(routes, [
        mockGetRecipe,
        mockGetUnitConversions,
        mockCurrentUserAdmin,
        mockLinkedRecipesForRecipeTwo,
    ]);
};

describe('IngredientList', () => {
    afterEach(() => {
        cleanup();
    });
    it('should not display skipped prep methods', async () => {
        // Render
        renderComponent();
        await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
        // Expect
        expect(screen.queryByText('1 oz apples')).not.toBeNull();
    });
    it('should display the used in section for ingredients used in other recipes', async () => {
        // Render
        renderComponent();
        await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
        // Expect
        expect(await screen.findByText('Used in')).not.toBeNull();
        expect(screen.queryByText('Recipe Using Mock Recipe Two')).not.toBeNull();
    });
});
