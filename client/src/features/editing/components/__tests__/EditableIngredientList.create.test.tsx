import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { haveValueByLabelText } from '@recipe/utils/tests';
import { mockCreateSize } from '@recipe/graphql/mutations/__mocks__/size';
import { clickFindByText, clickGetByText, notNullByText } from '@recipe/utils/tests';
import { mockCreatePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockCreateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockCreateBespokePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockCreateBespokeUnit, mockCreateUnit } from '@recipe/graphql/mutations/__mocks__/unit';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Creating new items', () => {
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
        await user.click(screen.getByText('Long singular name'));
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
    });

    it('should create a new bespoke unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
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
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await clickFindByText(screen, user, 'chicken', 'skip prep method');

        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');

        // Expect --------------------------------------------------------------
        expect(screen.queryByText('1 bump chicken')).not.toBeNull();
        expect(screen.queryByText('teaspoon')).not.toBeNull;
        expect(screen.queryByText('bump')).toBeNull();
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
        expect(await screen.findByText('1 chicken, pipped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
        // ------ Available as new prepMethod -----------------------------------
        expect(await screen.findByLabelText('skip quantity')).not.toBeNull();
        await user.keyboard('{2}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chickens');
        expect(await screen.findByLabelText('skip prep method')).not.toBeNull();
        expect(screen.queryByLabelText('pipped')).not.toBeNull();
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
        await notNullByText(screen, '1 chicken, posted', 'Enter ingredient');
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
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');

        // Expect --------------------------------------------------------------
        expect(screen.queryByText('1 chicken, posted')).not.toBeNull();
        expect(screen.queryByText('diced')).not.toBeNull();
        expect(screen.queryByText('posted')).toBeNull();
    });
});
