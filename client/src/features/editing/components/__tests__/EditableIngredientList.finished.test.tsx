import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { clickGetByText, notNullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('FinishedIngredient', () => {
    afterEach(() => {
        cleanup();
    });
    it('should display a completed item', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');

        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'ounce', 'chicken', 'chopped');

        // Expect
        expect(screen.queryByText('1 oz chicken, chopped')).not.toBeNull();
    });
    it('should display two completed items', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'ounce', 'chicken', 'chopped');

        await user.keyboard('{2}{ }');
        await clickGetByText(screen, user, 'ounces', 'iceberg lettuce', 'diced');

        // Expect
        await notNullByText(screen, '1 oz chicken, chopped', '2 oz iceberg lettuce, diced');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item without a unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken', 'chopped');

        // Expect
        await notNullByText(screen, '1 chicken, chopped', 'Enter ingredient');
    });
    it('should display a completed item without a prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'ounce', 'chicken', 'skip prep method');

        // Expect
        await notNullByText(screen, '1 oz chicken', 'Enter ingredient');
    });
    it('should display a completed item without a prepMethod or unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken', 'skip prep method');

        // Expect
        await notNullByText(screen, '1 chicken', 'Enter ingredient');
    });
    it('should display a completed item with plural units', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{ }');
        await clickGetByText(screen, user, 'cups', 'chicken', 'chopped');

        // Expect
        await notNullByText(screen, '2 cups chicken, chopped', 'Enter ingredient');
    });
    it('should display a completed item with no unit and plural ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chickens', 'chopped');

        // Expect
        await notNullByText(screen, '2 chickens, chopped', 'Enter ingredient');
    });
    it('should displat a completed item with a size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'large', 'chicken', 'chopped');

        // Expect
        await notNullByText(screen, '1 large chicken, chopped', 'Enter ingredient');
    });
    it('should display a completed item with no quantity or unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await clickGetByText(screen, user, 'Enter ingredient', 'skip quantity', 'chicken');
        await user.click(screen.getByText('chopped'));

        // Expect
        await notNullByText(screen, 'chicken, chopped', 'Enter ingredient');
    });
    it('should display a completed item with no quantity or unit from typing', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{c}{h}{i}');
        await clickGetByText(screen, user, 'chicken', 'chopped');

        // Expect
        await notNullByText(screen, 'chicken, chopped', 'Enter ingredient');
    });
});
