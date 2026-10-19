import createFetchMock from 'vitest-fetch-mock';
import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { getMockedImageBlob, haveValueByLabelText } from '@recipe/utils/tests';
import { enterCreateNewRecipePage, enterEditRecipePage } from '@recipe/utils/tests';

import { renderComponent } from './utils';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

loadErrorMessages();
loadDevMessages();

// The OS kills a backgrounded PWA without running React cleanup, so the draft stays in
// localStorage. A test cannot skip cleanup, so it copies the draft before unmounting and
// writes it back afterwards.
function simulateAppKill(key: string) {
    const draft = localStorage.getItem(key);
    expect(draft).not.toBeNull();
    cleanup();
    expect(localStorage.getItem(key)).toBeNull();
    localStorage.setItem(key, draft!);
}

describe('Recipe drafts', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('should restore an unsaved new recipe after the app is killed', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter recipe title'));
        await user.keyboard('Draft Recipe');
        simulateAppKill('recipe:draft:create');
        renderComponent();
        await enterCreateNewRecipePage(screen, user);

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter recipe title', 'Draft Recipe');
        expect(await screen.findByText('Restored unsaved changes')).not.toBeNull();
    });

    it('should restore unsaved edits after the app is killed', async () => {
        // Render -----------------------------------------------
        fetchMocker.mockResponse(getMockedImageBlob());
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Enter recipe title'));
        await user.keyboard('{Backspace>11/}Draft Title');
        simulateAppKill('recipe:draft:edit:mock-recipe-one');
        renderComponent();
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter recipe title', 'Draft Title');
        expect(await screen.findByText('Restored unsaved changes')).not.toBeNull();
    });

    it('should not restore a draft after leaving the page', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter recipe title'));
        await user.keyboard('Draft Recipe');
        await user.click(screen.getByLabelText('Navigate to home page'));
        await enterCreateNewRecipePage(screen, user);

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter recipe title', '');
        expect(screen.queryByText('Restored unsaved changes')).toBeNull();
    });
});
