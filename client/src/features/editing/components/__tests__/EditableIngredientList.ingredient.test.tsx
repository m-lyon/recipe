import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { nullByText } from '@recipe/utils/tests';
import { mockCreateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { clickGetByText, haveValueByLabelText, notNullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Ingredient Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should display completed ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{c}{h}{i}{ArrowUp}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup chicken, ');
    });
    it('should display completed recipe as ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{r}{h}{u}{ArrowUp}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup rhubarb pie, ');
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{p}{Enter}{Enter}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
        expect(screen.queryByText('add new size')).toBeNull();
        await user.keyboard('{Escape}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
        nullByText(screen, 'Invalid character.');
    });
    it('should display all ingredient options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));

        // Expect
        await notNullByText(screen, 'apples', 'carrots', 'chicken');
        await notNullByText(screen, 'iceberg lettuce', 'rhubarb pie');
    });
    it('should display add new ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{ }{a}{p}{p}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 apples, ');
    });
    it('should have a plural countable noun ingredient with a unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{p}');
        await user.click(screen.getByText('apples'));
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.queryByLabelText('1 cup apples')).not.toBeNull();
    });
    it('should revert back to quantity state after skip quantity clicked', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await clickGetByText(screen, user, 'Enter ingredient', 'skip quantity');
        await user.keyboard('{Backspace}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
    it('should revert back to quantity state after beginning to type', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await clickGetByText(screen, user, 'Enter ingredient', 'skip quantity');
        await user.keyboard('{c}{Backspace}{Backspace}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
    it('should display one debounced toast message for multiple invalid inputs', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{ArrowDown}{Enter}{1}{1}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup large ');
        expect(screen.queryAllByText('Invalid input').length).toBe(1);
    });
});
describe('Ingredient Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should display completed ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'cup', 'chicken');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup chicken, ');
    });
    it('should display completed recipe as ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'cup', 'rhubarb pie');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup rhubarb pie, ');
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{ }{a}{p}{p}');
        await user.click(screen.getByText('apples'));
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.queryByLabelText('2 apples')).not.toBeNull();
    });
    it('should have empty ingredient after skipping quantity and size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await clickGetByText(screen, user, 'Enter ingredient', 'skip quantity', 'skip size');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
    });
});
describe('Create new Ingredient', () => {
    afterEach(() => {
        cleanup();
    });

    it('should create a new ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateIngredient]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'skip size', 'add new ingredient');
        await user.keyboard('beef');
        await user.click(screen.getByLabelText('Save ingredient'));

        // Expect --------------------------------------------------------------
        await waitFor(() =>
            haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 beef, ')
        );
        expect(screen.queryByText('skip prep method')).not.toBeNull();
        // ------ Available as new ingredient -----------------------------------
        await user.keyboard('{Escape}');
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('skip unit'));
        expect(await screen.findByLabelText('apples')).not.toBeNull();
        expect(screen.queryByLabelText('beef')).not.toBeNull();
        // ------ New ingredient form is reset ----------------------------------------
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new ingredient'));
        haveValueByLabelText(screen, 'Name', '');
    });
});

describe('Ingredient Popover Behaviour', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset new ingredient form after close', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'skip size', 'add new ingredient');
        await user.keyboard('beef');
        await user.click(screen.getByLabelText('Close new ingredient form'));
        await user.click(screen.getByText('add new ingredient'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Name', '');
    });
    it('should reset state and close ingredient popover when clicked outside', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'skip size', 'add new ingredient');
        await user.keyboard('beef');
        await user.click(document.body);

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('add new ingredient')).toBeNull();
        expect(screen.queryByLabelText('Plural name')).toBeNull();
    });
    it('should close new ingredient popover if bespoke unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{t}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByText('use "cut" as unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cut');
        nullByText(screen, 'Add new size');
    });
    it('should close new ingredient popover if existing unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByText('cup'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if existing size is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{s}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByText('small'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 small ');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if existing ingredient is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByText('chicken'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 chicken, ');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if skip unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{a}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace}');
        await user.click(screen.getByText('skip unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if skip size is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('a');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace}');
        await user.click(screen.getByText('skip size'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if state is moved back to size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{s}');
        await user.click(screen.getByText('small'));
        await user.keyboard('{s}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup small');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if state is moved back to size after skip size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('cup'));
        await user.click(screen.getByText('skip size'));
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if state is moved back to unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if state is moved back to unit after skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if state is moved back to quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
        nullByText(screen, 'Add new ingredient');
    });
    it('should close new ingredient popover if state is moved back to quantity after skip quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{s}');
        await user.click(screen.getByText('add new ingredient'));
        waitFor(() => expect(screen.queryByText('Add new ingredient')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        nullByText(screen, 'Add new ingredient');
    });
});
