import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { nullByText } from '@recipe/utils/tests';
import { mockBumpId } from '@recipe/graphql/__mocks__/ids';
import { mockDeleteBespokeUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { clickFindByText, haveValueByLabelText, notNullByText } from '@recipe/utils/tests';
import { mockCreateBespokeUnit, mockCreateUnit } from '@recipe/graphql/mutations/__mocks__/unit';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Unit Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{Escape}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        nullByText(screen, 'Invalid character.');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the size state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{t}{z}');

        // Expect
        expect(screen.queryByText('add new unit')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{t}{z}{Enter}');

        // Expect
        await notNullByText(screen, 'Add new unit', 'Save');
    });

    it('should reset back to the quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{g}{ }{Backspace>3/}');

        // Expect
        nullByText(screen, 'chicken', 'cup');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
    });
    it('should display one debounced toast message for multiple invalid inputs', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{1}{1}');

        // Expect
        expect(screen.queryAllByText('Invalid input').length).toBe(1);
    });
});
describe('Unit Spacebar', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the size state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{p}{ }');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        await notNullByText(screen, 'large', 'chicken');
        expect(screen.queryByText('cup')).toBeNull();
    });
    it('should switch to the size state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{ }{c}{u}{p}{s}{ }');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups ');
        await notNullByText(screen, 'large', 'chicken');
        expect(screen.queryByText('cups')).toBeNull();
    });
});
describe('Unit Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the size state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
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
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{t}{z}');
        await user.click(screen.getByText('add new unit'));

        // Expect
        await notNullByText(screen, 'Add new unit', 'Save');
    });
    it('should revert back to unit state after unit skip and backspace', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('{Backspace}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        await notNullByText(screen, 'skip unit', 'gram', 'ounce', 'cup');
    });
});
describe('Create new Unit', () => {
    afterEach(() => {
        cleanup();
    });
    it('should create a new unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        await user.keyboard('{c}{u}{t}');
        await user.click(screen.getByLabelText('Long singular name'));
        await user.keyboard('{c}{u}{t}{t}{i}{n}{g}');
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await user.keyboard('{c}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cut c');
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
        // ------ Available as new unit ----------------------------------------
        await user.keyboard('{Escape}');
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        expect(await screen.findByLabelText('teaspoons')).not.toBeNull();
        expect(screen.queryByLabelText('cutting')).not.toBeNull();
        // ------ New unit form is reset ----------------------------------------
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new unit'));
        haveValueByLabelText(screen, 'Short singular name', '');
    });
});
describe('Unit Popover Behaviour', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset new unit form after close', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.keyboard('{c}{u}{t}');
        await user.click(screen.getByLabelText('Close new unit form'));
        await user.click(screen.getByText('add new unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Short singular name', '');
    });
    it('should reset state and close unit popover when clicked outside', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.keyboard('{c}{u}{t}');
        await user.click(document.body);

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('add new unit')).toBeNull();
        expect(screen.queryByLabelText('Short singular name')).toBeNull();
    });
    it('should close new unit popover if bespoke unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.click(screen.getByText('use "c" as unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 c');
        nullByText(screen, 'Add new unit');
    });
    it('should close new unit popover if existing unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.click(screen.getByText('cup'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        nullByText(screen, 'Add new unit');
    });
    it('should close new unit popover if existing size is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{s}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.click(screen.getByText('small'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 small ');
        nullByText(screen, 'Add new unit');
    });
    it('should close new unit popover if existing ingredient is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.click(screen.getByText('chicken'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 chicken, ');
        nullByText(screen, 'Add new unit');
    });
    it('should close new unit popover if skip unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace}');
        await user.click(screen.getByText('skip unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        nullByText(screen, 'Add new unit', 'skip unit');
    });
    it('should close new unit popover if state is moved back to quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        waitFor(() => expect(screen.queryByText('Add new unit')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
        nullByText(screen, 'Add new unit');
    });
});
describe('Bespoke Unit', () => {
    afterEach(() => {
        cleanup();
    });
    it('should create a new bespoke unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await user.keyboard('{c}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 bump c');
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
    });
    it('should create a new bespoke unit, and not be a dropdown option', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await clickFindByText(screen, user, 'chicken', 'skip prep method');
        haveValueByLabelText(screen, 'Input ingredient #2 for subsection 1', '');
        await user.keyboard('{1}{ }');

        // Expect --------------------------------------------------------------
        expect(screen.queryByLabelText('1 bump chicken')).not.toBeNull();
        expect(screen.queryByText('teaspoon')).not.toBeNull;
        expect(screen.queryByText('bump')).toBeNull();
    });
    it('should reset new bespoke unit form after close', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByLabelText('Unit name'));
        await user.keyboard('{i}{n}{g}');
        await user.click(screen.getByLabelText('Close new bespoke unit form'));
        await user.click(screen.getByText('use "bump" as unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Unit name', 'bump');
    });
    it('should reset state and close bespoke unit popover when clicked outside', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(document.body);

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('add new unit')).toBeNull();
        expect(screen.queryByLabelText('Unit name')).toBeNull();
    });
    it('should close bespoke unit popover if new unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('add new unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 bump');
        nullByText(screen, 'Use bespoke unit');
    });
    it('should close bespoke unit popover if existing unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}');
        await user.click(screen.getByText('use "cu" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('cup'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        nullByText(screen, 'Use bespoke unit');
    });
    it('should close bespoke unit popover if existing size is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{s}');
        await user.click(screen.getByText('use "s" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('small'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 small ');
        nullByText(screen, 'Use bespoke unit');
    });
    it('should close bespoke unit popover if existing ingredient is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{h}');
        await user.click(screen.getByText('use "ch" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('chicken'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 chicken, ');
        nullByText(screen, 'Use bespoke unit');
    });
    it('should close bespoke unit popover if skip unit is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}');
        await user.click(screen.getByText('use "cu" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>2/}');
        await user.click(screen.getByText('skip unit'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        nullByText(screen, 'Use bespoke unit');
    });
    it('should close bespoke unit popover if state is moved back to quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>5/}');

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
        nullByText(screen, 'Use bespoke unit');
    });
});
describe('Delete Bespoke Unit', () => {
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    afterEach(() => {
        cleanup();
        consoleMock.mockReset();
    });
    it('should delete a bespoke unit via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit, mockDeleteBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await user.click(await screen.findByText('chicken'));
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(`Successfully deleted unit ${mockBumpId}`);
    });
    it('should delete a bespoke unit via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit, mockDeleteBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await clickFindByText(screen, user, 'chicken');
        await user.keyboard('{Escape}');

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(`Successfully deleted unit ${mockBumpId}`);
    });
    it('should delete a bespoke unit via remove finished ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit, mockDeleteBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        waitFor(() => expect(screen.queryByText('Use bespoke unit')).not.toBeNull());
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await clickFindByText(screen, user, 'chicken', 'skip prep method');
        await user.click(screen.getByLabelText('Remove 1 bump chicken'));

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(`Successfully deleted unit ${mockBumpId}`);
    });
});
