import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Edit Recipe Page: store hydration', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not duplicate recipe items when revisiting the edit page', async () => {
        // Revisiting the edit page re-hydrates the recipe store from the (now cached)
        // query. If the stale store content renders first, the re-keyed items exit
        // and enter via AnimatePresence, briefly duplicating every tag/ingredient and
        // visibly collapsing the page when the exit animations finish.
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        expect(await screen.findByText('Recipes')).not.toBeNull();
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect -----------------------------------------------
        // Sample the DOM across the window in which the old items would still be
        // exit-animating alongside the new ones.
        for (let i = 0; i < 12; i++) {
            expect(screen.getAllByLabelText('Remove lunch tag')).toHaveLength(1);
            expect(screen.getAllByLabelText('Enter recipe title')).toHaveLength(1);
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    });
});
