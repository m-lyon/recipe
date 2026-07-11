import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { ShareButton } from '@recipe/features/viewing';

function renderShareButton() {
    return render(
        <ChakraProvider>
            <ShareButton title='Tomato Soup' />
        </ChakraProvider>
    );
}

describe('ShareButton', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });

    it('uses the Web Share API when available', async () => {
        const user = userEvent.setup();
        const share = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'share', { value: share, configurable: true });

        renderShareButton();
        await user.click(screen.getByLabelText('Share recipe'));

        expect(share).toHaveBeenCalledWith({
            title: 'Tomato Soup',
            url: window.location.href,
        });
    });

    it('falls back to copying the link when the Web Share API is unavailable', async () => {
        const user = userEvent.setup();
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        renderShareButton();
        await user.click(screen.getByLabelText('Share recipe'));

        expect(writeText).toHaveBeenCalledWith(window.location.href);
    });
});
