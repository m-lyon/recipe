import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { nullByText } from '@recipe/utils/tests';
import { mockCreateSize } from '@recipe/graphql/mutations/__mocks__/size';
import { clickGetByText, haveValueByLabelText, notNullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Size Keyboard', () => {
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
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        await user.keyboard('{Escape}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{ArrowDown}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup large ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'small');
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }{ArrowDown}{Enter}{ArrowDown}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups large ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cups', 'small');
    });
    it('should display skip size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{Enter}');

        // Expect
        expect(screen.queryByText('skip size')).not.toBeNull();
    });
    it('should display all size options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Enter}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).toBeNull();
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        await notNullByText(screen, 'small', 'medium', 'large');
    });
    it('should display add new size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{p}{ }{c}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup c');

        // Expect
        expect(screen.queryByText('add new size')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Enter}{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{Enter}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'small');
    });
    it('should open up the new size popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{Enter}{c}{u}{t}{z}{Enter}');

        // Expect
        await notNullByText(screen, 'Add new size', 'Save');
    });

    it('should reset back to the quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{g}{ }{s}{m}{a}{Enter}{Backspace>9/}');

        // Expect
        nullByText(screen, 'chicken', 'cup', 'small');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
    });
    it('should display one debounced toast message for multiple invalid inputs', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{1}{1}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        expect(screen.queryAllByText('Invalid input').length).toBe(1);
    });
});
describe('Size Spacebar', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the ingredient state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('1 cup large ');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup large ');
        expect(await screen.findByText('chicken')).not.toBeNull();
        nullByText(screen, 'large', 'cup');
    });
    it('should switch to the ingredient state from unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('large ');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', 'large ');
        expect(await screen.findByText('chicken')).not.toBeNull();
        nullByText(screen, 'small', 'cup');
    });
});
describe('Size Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.click(screen.getByText('small'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup small ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'large');
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('cups'));
        await user.click(screen.getByText('small'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups small ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cups', 'large');
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        await user.click(document.body);

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('skip size'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'small');
    });
    it('should open up the new size popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup c');
        await user.click(screen.getByText('add new size'));

        // Expect
        await notNullByText(screen, 'Add new size', 'Save');
    });
});
describe('Create new Size', () => {
    afterEach(() => {
        cleanup();
    });
    it('should create a new size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateSize]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('a');
        await user.click(screen.getByText('add new size'));
        await user.keyboard('extra large');
        await user.click(screen.getByLabelText('Save size'));

        // Expect --------------------------------------------------------------
        await waitFor(() =>
            haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 extra large ')
        );
        // ------ Available as new size -----------------------------------------
        await user.keyboard('{Escape}');
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await clickGetByText(screen, user, 'skip unit');
        expect(await screen.findByLabelText('extra large')).not.toBeNull();
        expect(screen.queryByLabelText('large')).not.toBeNull();
        // ------ New size form is reset ----------------------------------------
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new size'));
        haveValueByLabelText(screen, 'Name', '');
    });
});
describe('Size Popover Behaviour', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset new size form after close', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('a');
        await user.click(screen.getByText('add new size'));
        await user.keyboard('extra large');
        await user.click(screen.getByLabelText('Close new size form'));
        await user.click(screen.getByText('add new size'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Name', '');
    });
    it('should reset state and close size popover when clicked outside', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('a');
        await user.click(screen.getByText('add new size'));
        await user.keyboard('extra large');
        await user.click(document.body);

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('add new size')).toBeNull();
        expect(screen.queryByLabelText('Name')).toBeNull();
    });
    it('should close new size popover if bespoke unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{t}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByText('use "cut" as unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cut');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if existing unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByText('cup'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if existing size is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{s}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByText('small'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 small ');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if existing ingredient is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByText('chicken'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 chicken, ');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if skip unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{a}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace}');
        await user.click(screen.getByText('skip unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if skip size is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('a');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace}');
        await user.click(screen.getByText('skip size'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if state is moved back to unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if state is moved back to unit after skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if state is moved back to quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
        nullByText(screen, 'Add new size');
    });
    it('should close new size popover if state is moved back to quantity after skip quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{s}');
        await user.click(screen.getByText('add new size'));
        waitFor(() => expect(screen.queryByText('Add new size')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        nullByText(screen, 'Add new size');
    });
});
