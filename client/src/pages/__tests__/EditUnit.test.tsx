import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGramId, mockTeaspoonId } from '@recipe/graphql/__mocks__/ids';
import { mockDeleteUnit, mockUpdateUnit } from '@recipe/graphql/mutations/__mocks__/unit';

import { EditUnit } from '../EditUnit';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditUnit />} />);
    renderPage(routes, [mockGetUnits, mockCurrentUser, ...mocks]);
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
        await waitFor(() => expect(screen.getByLabelText('teaspoon')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select unit'), mockTeaspoonId);
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        await user.click(screen.getByLabelText('Long plural name'));
        await user.keyboard('{Backspace}z');
        await user.click(screen.getByLabelText('Save unit'));
        await user.selectOptions(screen.getByLabelText('Select unit'), mockGramId);
        await user.selectOptions(screen.getByLabelText('Select unit'), mockTeaspoonId);

        // Expect
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        expect(screen.getByLabelText('Long plural name')).toHaveProperty('value', 'teaspoonz');
    });

    it('should not save an update to a unit', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('teaspoon')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select unit'), mockTeaspoonId);
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        await user.click(screen.getByLabelText('Long plural name'));
        await user.keyboard('{Backspace}z');
        await user.selectOptions(screen.getByLabelText('Select unit'), mockGramId);
        await user.selectOptions(screen.getByLabelText('Select unit'), mockTeaspoonId);

        // Expect
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        expect(screen.getByLabelText('Long plural name')).toHaveProperty('value', 'teaspoons');
    });

    it('should remove a unit', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockDeleteUnit]);

        // Act
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('teaspoon')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select unit'), mockTeaspoonId);
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        await user.click(screen.getByLabelText('Delete unit'));
        await user.selectOptions(screen.getByLabelText('Select unit'), mockGramId);

        // Expect
        expect(screen.queryByLabelText('kilogram')).not.toBeNull();
        expect(screen.queryByLabelText('teaspoon')).toBeNull();
    });
});
