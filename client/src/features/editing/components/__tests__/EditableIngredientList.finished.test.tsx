import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { notNullByText } from '@recipe/utils/tests';
import { clickGetByText, haveValueByLabelText, notNullByLabelText } from '@recipe/utils/tests';

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
        expect(screen.queryByLabelText('1 oz chicken, chopped')).not.toBeNull();
    });
    it('should display the next dropdown after completing an ingredient through clicking', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await clickGetByText(screen, user, 'Enter ingredient', 'skip quantity', 'chicken');
        await user.click(screen.getByText('chopped'));

        // Expect
        await notNullByLabelText(screen, 'chicken, chopped');
    });
    it('should display the next dropdown after completing an ingredient through typing', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{c}{h}{i}{Enter}{ArrowDown}{Enter}');

        // Expect
        await notNullByLabelText(screen, 'chicken, chopped');
        await notNullByText(screen, 'skip quantity');
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
        await notNullByLabelText(screen, '1 oz chicken, chopped', '2 oz iceberg lettuce, diced');
        haveValueByLabelText(screen, 'Input ingredient #3 for subsection 1', '');
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
        await notNullByLabelText(screen, '1 chicken, chopped');
        haveValueByLabelText(screen, 'Input ingredient #2 for subsection 1', '');
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
        await notNullByLabelText(screen, '1 oz chicken');
        haveValueByLabelText(screen, 'Input ingredient #2 for subsection 1', '');
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
        await notNullByLabelText(screen, '1 chicken');
        haveValueByLabelText(screen, 'Input ingredient #2 for subsection 1', '');
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
        await notNullByLabelText(screen, '2 cups chicken, chopped');
        await notNullByText(screen, 'Enter quantity');
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
        await notNullByLabelText(screen, '2 chickens, chopped');
        await notNullByText(screen, 'Enter quantity');
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
        await notNullByLabelText(screen, '1 large chicken, chopped');
        haveValueByLabelText(screen, 'Input ingredient #2 for subsection 1', '');
    });
    it('should display a completed item with no quantity or unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await clickGetByText(screen, user, 'Enter ingredient', 'skip quantity', 'chicken');
        await user.click(screen.getByText('chopped'));

        // Expect
        await notNullByLabelText(screen, 'chicken, chopped');
        haveValueByLabelText(screen, 'Input ingredient #2 for subsection 1', '');
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
        await notNullByLabelText(screen, 'chicken, chopped');
        await notNullByText(screen, 'Enter quantity');
    });
});
