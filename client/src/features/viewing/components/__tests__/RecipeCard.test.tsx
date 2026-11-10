import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';

import { renderPage } from '@recipe/utils/tests';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';

import { RecipeCard, getCardTitle } from '../RecipeCard';

const renderCard = (recipe: RecipePreview) => {
    const routes = createRoutesFromElements(
        <Route
            path='/'
            element={
                <RecipeCard recipe={recipe} hasEditPermission={false} handleArchive={() => {}} />
            }
        />
    );
    return renderPage(routes);
};

describe('getCardTitle', () => {
    it('should return the title of a recipe that is not an ingredient', () => {
        expect(getCardTitle({ ...mockRecipeOne, pluralTitle: 'Plural' })).toBe(mockRecipeOne.title);
    });

    it('should return the plural title of an ingredient with more than one serving', () => {
        expect(getCardTitle(mockRecipeTwo)).toBe('Mock Recipes Two');
    });

    it('should return the title of an ingredient with one serving', () => {
        expect(getCardTitle({ ...mockRecipeTwo, numServings: 1 })).toBe(mockRecipeTwo.title);
    });

    it('should return the title of an ingredient with no plural title', () => {
        expect(getCardTitle({ ...mockRecipeTwo, pluralTitle: null })).toBe(mockRecipeTwo.title);
        expect(getCardTitle({ ...mockRecipeTwo, pluralTitle: '' })).toBe(mockRecipeTwo.title);
    });
});

describe('RecipeCard', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render an ingredient recipe with no plural title', async () => {
        renderCard({ ...mockRecipeTwo, pluralTitle: null });

        expect(await screen.findByRole('heading', { name: mockRecipeTwo.title })).not.toBeNull();
    });
});
