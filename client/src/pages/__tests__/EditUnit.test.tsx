import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { MockedResponses, haveValueByLabelText, renderPage } from '@recipe/utils/tests';
import { mockDeleteUnit, mockUpdateUnit } from '@recipe/graphql/mutations/__mocks__/unit';

import { EditUnit } from '../EditUnit';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditUnit />} />);
    return renderPage(routes, [mockGetUnits, mockCurrentUserAdmin, ...mocks]);
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
        renderComponent([mockDeleteUnit]);

        // Act
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        await user.click(screen.getByLabelText('Delete unit'));
        await user.click(screen.getByLabelText('Select unit'));
        await user.click(await screen.findByRole('option', { name: 'gram' }));

        // Expect
        await user.click(screen.getByLabelText('Select unit'));
        expect(await screen.findByRole('option', { name: 'kilogram' })).not.toBeNull();
        expect(screen.queryByRole('option', { name: 'teaspoon' })).toBeNull();
        await user.click(screen.getByLabelText('Select unit'));
    });
});
