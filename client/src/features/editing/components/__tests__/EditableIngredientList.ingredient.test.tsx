import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { haveValueByLabelText, notNullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('EditableIngredient Ingredient Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should display completed ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{c}{h}{i}{ArrowUp}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup chicken, ');
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{c}{u}{p}{Enter}{Enter}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
        expect(screen.queryByText('add new size')).toBeNull();
        await user.keyboard('{Escape}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display all ingredient options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));

        // Expect
        await notNullByText(screen, 'apples', 'carrots', 'chicken', 'iceberg lettuce');
    });
    it('should display add new ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{f}');

        // Expect
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should open up the new ingredient popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{f}{ArrowDown}{Enter}');

        // Expect
        expect(screen.queryByText('Add new ingredient')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
    it('should have a plural ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{2}{ }');
        await user.keyboard('{a}{p}{p}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 apples, ');
    });
    it('should have a plural countable noun ingredient with a unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{p}');
        await user.click(screen.getByText('apples'));
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.queryByText('1 cup apples')).not.toBeNull();
    });
    it('should revert back to quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.click(screen.getByText('skip quantity'));
        await user.keyboard('{Backspace}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
    it('should revert back to quantity state after beginning to type', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.click(screen.getByText('skip quantity'));
        await user.keyboard('{c}{Backspace}{Backspace}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
});
describe('EditableIngredient Ingredient Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should open up the new ingredient popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{f}');
        await user.click(screen.getByText('add new ingredient'));

        // Expect
        expect(screen.queryByText('Add new ingredient')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
    it('should have a plural ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{2}{ }');
        await user.keyboard('{a}{p}{p}');
        await user.click(screen.getByText('apples'));
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.queryByText('2 apples')).not.toBeNull();
    });
});
