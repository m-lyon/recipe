import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { haveValueByLabelText, notNullByText, nullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('EditableIngredient Unit Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Escape}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the size state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        expect(screen.queryByText('large')).not.toBeNull();
        expect(screen.queryByText('cup')).toBeNull();
    });
    it('should switch to the size state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }{ArrowDown}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups ');
        expect(screen.queryByText('large')).not.toBeNull();
        expect(screen.queryByText('cups')).toBeNull();
    });
    it('should display skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');

        // Expect
        expect(screen.queryByText('skip unit')).not.toBeNull();
    });
    it('should display all unit options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');

        // Expect
        expect(screen.queryByText('Enter ingredient')).toBeNull();
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        await notNullByText(screen, 'teaspoon', 'gram', 'ounce', 'cup');
    });
    it('should display add new unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{c}{u}{t}{z}');

        // Expect
        expect(screen.queryByText('Add new unit')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        await notNullByText(screen, 'chicken', 'large');
        expect(screen.queryByText('cup')).toBeNull();
    });
    it('should open up the new unit popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}{u}{t}{z}{Enter}');

        // Expect
        await notNullByText(screen, 'Add new unit', 'Save');
    });

    it('should reset back to the quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{g}{ }{Backspace>3/}');

        // Expect
        nullByText(screen, 'chicken', 'cup');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
    });
});
describe('EditableIngredient Unit Spacebar', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the size state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}{u}{p}{ }');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        expect(screen.queryByText('large')).not.toBeNull();
        expect(screen.queryByText('cup')).toBeNull();
    });
    it('should switch to the size state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{2}{ }{c}{u}{p}{s}{ }');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups ');
        expect(screen.queryByText('large')).not.toBeNull();
        expect(screen.queryByText('cups')).toBeNull();
    });
});
describe('EditableIngredient Unit Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the size state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        expect(screen.queryByText('large')).not.toBeNull();
        expect(screen.queryByText('cup')).toBeNull();
    });
    it('should switch to the size state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('cups'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups ');
        expect(screen.queryByText('large')).not.toBeNull();
        expect(screen.queryByText('cups')).toBeNull();
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}');
        await user.click(document.body);

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        await notNullByText(screen, 'chicken', 'large');
        expect(screen.queryByText('cup')).toBeNull();
    });
    it('should open up the new unit popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}{u}{t}{z}');
        await user.click(screen.getByText('add new unit'));

        // Expect
        await notNullByText(screen, 'Add new unit', 'Save');
    });
});
