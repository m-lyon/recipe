import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { cleanup, screen } from '@testing-library/react';
import { page, userEvent } from '@vitest/browser/context';
// import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage } from '@recipe/utils/browser';
import { mockImageFileOne } from '@recipe/graphql/mutations/__mocks__/image';

import { renderBrowserComponent } from './utils';

loadErrorMessages();
loadDevMessages();

if (typeof __dirname === 'undefined') {
    global.__dirname = dirname(fileURLToPath(import.meta.url));
}

// expect.extend({ toMatchImageSnapshot });

describe('Image Workflow', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('should display two images vertically stacked in mobile view', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) })
        );
        renderBrowserComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        user.upload(screen.getByLabelText('Upload image'), mockImageFileOne);

        // Expect ------------------------------------------------
        const image = await page.screenshot();
        // expect(image).toMatchImageSnapshot({ customSnapshotsDir: './__screenshots__/' });
    });
});
