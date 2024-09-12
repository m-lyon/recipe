import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { mockGetRecipe } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { ViewRecipe } from '../ViewRecipe';

loadErrorMessages();
loadDevMessages();

const renderComponent = () => {
    const routes = createRoutesFromElements(<Route path='/' element={<ViewRecipe />} />);
    renderPage(routes, [mockGetRecipe, mockGetRatingsRecipeOne, mockGetUnitConversions]);
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
});
