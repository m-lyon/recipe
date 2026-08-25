import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterViewRecipePage } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Scroll restoration', () => {
    afterEach(() => {
        cleanup();
    });

    it('resets scroll position when navigating from home to a recipe', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();
        expect(await screen.findByText('Recipes')).not.toBeNull();

        // Act --------------------------------------------------
        document.documentElement.scrollTop = 500;
        expect(window.scrollY).toBe(500);
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect -----------------------------------------------
        expect(window.scrollY).toBe(0);
    });
});
