import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, getDefaultNormalizer, screen } from '@testing-library/react';

import { clickGetByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Unit conversion', () => {
    afterEach(() => {
        cleanup();
    });

    it('should convert to grams when below 1 kg after unit clicked', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{0}{.}{5}{ }');
        await user.click(screen.getByText('kilograms'));

        // Expect
        expect(
            screen.queryByText('500g ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });

    it('should convert to grams when below 1kg after unit typed', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{0}{.}{5}{ }{k}{g}{ }');

        // Expect
        expect(
            screen.queryByText('500g ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });

    it('should show grams when below 1 kg in finished ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{0}{.}{5}{ }');
        await clickGetByText(screen, user, 'kilograms', 'chicken', 'chopped');

        // Expect
        expect(screen.queryByText('500g chicken, chopped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });

    it('should convert to 1 and a half teaspoons when given 1/2 tablespoon', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('1/2 ');
        await user.click(screen.getByText('tablespoon'));

        // Expect
        expect(
            screen.queryByText('1½ tsp ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });
});
