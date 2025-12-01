import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterViewRecipePage } from '@recipe/utils/tests';
import { mockZeroLinkedRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockLinkedRecipesForRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('View Recipe with UsedIn Section', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display "Used in" section when viewing a recipe that is an ingredient', async () => {
        // Render
        renderComponent([mockLinkedRecipesForRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');

        // Expect - The "Used in" section should be visible
        expect(await screen.findByText('Used in')).not.toBeNull();
        expect(await screen.findByText('Recipe Using Mock Recipe Two')).not.toBeNull();
    });

    it('should not display "Used in" section for recipes that are not ingredients', async () => {
        // Render
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Wait a bit to ensure component has time to render
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Expect - The "Used in" section should NOT be visible
        expect(screen.queryByText('Used in')).toBeNull();
    });

    it('should not display "Used in" section when no recipes use the ingredient', async () => {
        // Render
        renderComponent([mockZeroLinkedRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');

        // Wait a bit to ensure query completes
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Expect - The "Used in" section should NOT be visible since no recipes use it
        expect(screen.queryByText('Used in')).toBeNull();
    });
});
