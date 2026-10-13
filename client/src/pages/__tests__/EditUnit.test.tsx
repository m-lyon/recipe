import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockGetEditableUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { MockedResponses, haveValueByLabelText, renderPage } from '@recipe/utils/tests';
import { mockDeleteUnit, mockUpdateUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { mockGetEditableUnitsWithCutting } from '@recipe/graphql/mutations/__mocks__/unit';

import { EditUnit } from '../EditUnit';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = [], units = mockGetEditableUnits) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditUnit />} />);
    return renderPage(routes, [units, ...mocks]);
};

describe('Edit Unit', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update a unit', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockUpdateUnit]);

        // Act
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        await user.click(screen.getByLabelText('Long plural name'));
        await user.keyboard('{Backspace}z');
        await user.click(screen.getByLabelText('Save unit'));
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'gram' }));
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));

        // Expect
        haveValueByLabelText(screen, 'Short singular name', 'tsp');
        haveValueByLabelText(screen, 'Long plural name', 'teaspoonz');
    });

    it('should not save an update to a unit', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        await user.click(screen.getByLabelText('Long plural name'));
        await user.keyboard('{Backspace}z');
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'gram' }));
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));

        // Expect
        haveValueByLabelText(screen, 'Short singular name', 'tsp');
        haveValueByLabelText(screen, 'Long plural name', 'teaspoons');
    });

    it('should remove a unit', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockDeleteUnit], mockGetEditableUnitsWithCutting);

        // Act
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'cutting' }));
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'cut');
        await user.click(screen.getByLabelText('Delete unit'));
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'gram' }));

        // Expect
        await user.click(screen.getByLabelText('Select unit'));
        expect(await screen.findByRole('option', { name: 'kilogram' })).not.toBeNull();
        expect(screen.queryByRole('option', { name: 'cutting' })).toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
    });

    it('should show the size of a standard unit and not offer to delete it', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));

        // Expect
        expect(screen.getByLabelText('Unit size').textContent).toBe(
            'Standard unit: 1 teaspoon = 4.9289 ml (US).'
        );
        expect(screen.queryByLabelText('Dimension')).toBeNull();
        expect(screen.queryByLabelText('Delete unit')).toBeNull();
        expect(screen.getByLabelText('Save unit')).not.toBeNull();
    });
});
