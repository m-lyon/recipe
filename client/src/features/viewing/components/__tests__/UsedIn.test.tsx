import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { mockRecipeIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockZeroLinkedRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockLinkedRecipesForRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';

import { UsedIn } from '../UsedIn';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: any[] = []) => {
    const MockUsedIn = () => {
        return <UsedIn recipeId={mockRecipeIdTwo} />;
    };

    const routes = createRoutesFromElements(<Route path='/' element={<MockUsedIn />} />);
    return renderPage(routes, mocks);
};

describe('UsedIn Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display "Used in" heading and recipe links when recipes are found', async () => {
        // Render
        renderComponent([mockLinkedRecipesForRecipeTwo]);

        // Expect
        expect(await screen.findByText('Used in')).not.toBeNull();
        expect(await screen.findByText('Recipe Using Mock Recipe Two')).not.toBeNull();
        expect(await screen.findByText('Another Recipe Using Mock Two')).not.toBeNull();
    });

    it('should not render anything when no recipes use the ingredient', async () => {
        // Render
        renderComponent([mockZeroLinkedRecipeTwo]);

        // Wait a bit for query to complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Expect
        expect(screen.queryByText('Used in')).toBeNull();
    });

    it('should render recipe links with correct URLs', async () => {
        // Render
        renderComponent([mockLinkedRecipesForRecipeTwo]);

        // Act
        const link = await screen.findByText('Recipe Using Mock Recipe Two');

        // Expect - the link should be properly formed
        expect(link.closest('a')).toHaveProperty(
            'pathname',
            '/recipes/view/recipe/recipe-using-mock-recipe-two'
        );
    });

    it('should render multiple recipe links correctly', async () => {
        // Render
        renderComponent([mockLinkedRecipesForRecipeTwo]);

        // Expect
        const links = await screen.findAllByRole('link');
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveTextContent('Recipe Using Mock Recipe Two');
        expect(links[1]).toHaveTextContent('Another Recipe Using Mock Two');
    });
});
