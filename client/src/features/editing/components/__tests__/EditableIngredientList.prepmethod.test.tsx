import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockPostedId } from '@recipe/graphql/__mocks__/ids';
import { clickFindByText, notNullByText, nullByText } from '@recipe/utils/tests';
import { mockCreatePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockCreateBespokePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockDeleteBespokePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { clickGetByText, haveValueByLabelText, notNullByLabelText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('PrepMethod Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter}{ArrowDown}{Enter}{ArrowUp}{Enter}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1g large apples, ');
        expect(screen.queryByText('chopped')).not.toBeNull();
        await user.keyboard('{Escape}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
    });
    it('should display skip prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Enter}{ArrowDown>5/}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 carrot, ');
        expect(screen.queryByText('skip prep method')).not.toBeNull();
    });
    it('should display all prepMethod options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter>3/}');

        // Expect
        await notNullByText(screen, 'chopped', 'diced', 'sliced', 'whole');
    });
    it('should display add new prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter>3/}{c}{h}{i}');

        // Expect
        expect(screen.queryByText('add new prep method')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter}{ArrowDown}{Enter}{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter>2/}{ArrowDown}{Enter}');
        await user.click(screen.getByText('skip prep method'));

        // Expect
        await notNullByText(screen, 'Enter ingredient');
        await notNullByLabelText(screen, '1 cup carrots');
    });
    it('should open up the new prepMethod popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter>3/}{ArrowUp}{h}{e}{a}{t}');
        await user.keyboard('{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup apples, heat');
        await notNullByText(screen, 'Add new prep method', 'Save');
    });
});
describe('PrepMethod Click', () => {
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
        await clickGetByText(screen, user, 'cup', 'chicken');
        await user.keyboard('{c}{h}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');

        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await clickGetByText(screen, user, 'chicken', 'skip prep method');

        // Expect
        expect(screen.queryByLabelText('1 cup chicken')).not.toBeNull();
    });
    it('should open up the new prepMethod popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');

        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(screen.getByText('chicken'));
        await user.keyboard('{c}{h}{i}');
        await user.click(screen.getByText('add new prep method'));

        // Expect
        await notNullByText(screen, '1 cup chicken, chi', 'Add new prep method', 'Save');
    });
});

describe('Create new PrepMethod', () => {
    afterEach(() => {
        cleanup();
    });

    it('should create a new prep method', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreatePrepMethod]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');
        await user.keyboard('{p}');
        await user.click(screen.getByText('add new prep method'));
        await user.keyboard('pipped');
        await user.click(screen.getByLabelText('Save prep method'));

        // Expect --------------------------------------------------------------
        expect(await screen.findByLabelText('1 chicken, pipped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
        // ------ Available as new prepMethod -----------------------------------
        expect(await screen.findByLabelText('skip quantity')).not.toBeNull();
        await user.keyboard('{2}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chickens');
        expect(await screen.findByLabelText('skip prep method')).not.toBeNull();
        expect(screen.queryByLabelText('pipped')).not.toBeNull();
        // ------ New prep method form is reset ----------------------------------------
        await user.keyboard('{c}');
        await user.click(screen.getByText('add new prep method'));
        haveValueByLabelText(screen, 'Name', '');
    });
});

describe('PrepMethod Popover Behaviour', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset new prep method form after close', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');
        await user.keyboard('{p}');
        await user.click(screen.getByText('add new prep method'));
        await user.keyboard('pipped');
        await user.click(screen.getByLabelText('Close new prep method form'));
        await user.click(screen.getByText('add new prep method'));

        // Expect --------------------------------------------------------------
        haveValueByLabelText(screen, 'Name', '');
    });
    it('should reset state and close prep method popover when clicked outside', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');
        await user.keyboard('{p}');
        await user.click(screen.getByText('add new prep method'));
        await user.keyboard('pipped');
        await user.click(document.body);

        // Expect --------------------------------------------------------------
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
        expect(screen.queryByText('add new prep method')).toBeNull();
        expect(screen.queryByLabelText('Name')).toBeNull();
    });
    it('should close new prep method popover if bespoke prep method is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokePrepMethod]);

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(screen.getByText('chicken'));
        await user.keyboard('posted');
        await user.click(screen.getByText('add new prep method'));
        waitFor(() => expect(screen.queryByText('Add new prep method')).not.toBeNull());
        await user.click(screen.getByText('use "posted" as prep method'));

        // Expect
        await notNullByLabelText(screen, '1 cup chicken, posted');
        nullByText(screen, 'Add new prep method');
    });
    it('should close new prep method popover if existing prep method is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(screen.getByText('chicken'));
        await user.keyboard('chopp');
        await user.click(screen.getByText('add new prep method'));
        waitFor(() => expect(screen.queryByText('Add new prep method')).not.toBeNull());
        await user.click(screen.getByText('chopped'));

        // Expect
        await notNullByLabelText(screen, '1 cup chicken, chopped');
        nullByText(screen, 'Add new prep method');
    });
    it('should close new prep method popover if skip prep method is selected', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(screen.getByText('chicken'));
        await user.keyboard('chop');
        await user.click(screen.getByText('add new prep method'));
        waitFor(() => expect(screen.queryByText('Add new prep method')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>4/}');
        await user.click(screen.getByText('skip prep method'));

        // Expect
        await notNullByLabelText(screen, '1 cup chicken');
        nullByText(screen, 'Add new prep method');
    });
    it('should close new prep method popover if state is moved back to ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(screen.getByText('chicken'));
        await user.keyboard('chop');
        await user.click(screen.getByText('add new prep method'));
        waitFor(() => expect(screen.queryByText('Add new prep method')).not.toBeNull());
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{Backspace>5/}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup chicken');
        nullByText(screen, 'Add new prep method');
    });
});

describe('Bespoke PrepMethod', () => {
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    afterEach(() => {
        cleanup();
        consoleMock.mockReset();
    });

    it('should create a new bespoke prep method', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokePrepMethod]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');
        await user.keyboard('{p}{o}{s}{t}{e}{d}');
        await user.click(screen.getByText('use "posted" as prep method'));

        // Expect --------------------------------------------------------------
        await notNullByLabelText(screen, '1 chicken, posted');
        await notNullByText(screen, 'Enter ingredient');
    });

    it('should create a new bespoke prep method, and not be a dropdown option', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokePrepMethod]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');
        await user.keyboard('{p}{o}{s}{t}{e}{d}');
        await user.click(screen.getByText('use "posted" as prep method'));
        await notNullByLabelText(screen, '1 chicken, posted');
        await user.keyboard('{1}{ }');
        await clickFindByText(screen, user, 'skip unit', 'chicken');

        // Expect --------------------------------------------------------------
        expect(screen.queryByLabelText('1 chicken, posted')).not.toBeNull();
        expect(screen.queryByText('diced')).not.toBeNull();
        expect(screen.queryByText('posted')).toBeNull();
    });

    it('should delete a bespoke prep method via remove finished ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokePrepMethod, mockDeleteBespokePrepMethod]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');
        await user.keyboard('{p}{o}{s}{t}{e}{d}');
        await user.click(screen.getByText('use "posted" as prep method'));
        await user.click(await screen.findByLabelText('Remove 1 chicken, posted'));

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(
            `Successfully deleted prep method ${mockPostedId}`
        );
    });
});
