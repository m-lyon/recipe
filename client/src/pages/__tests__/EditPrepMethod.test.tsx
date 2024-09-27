import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockDicedId, mockSlicedId } from '@recipe/graphql/__mocks__/ids';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockUpdatePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockDeletePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';

import { EditPrepMethod } from '../EditPrepMethod';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditPrepMethod />} />);
    renderPage(routes, [mockGetPrepMethods, mockCurrentUser, ...mocks]);
};

describe('Edit Prep Method', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update a prep method', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockUpdatePrepMethod]);

        // Act
        expect(await screen.findByText('Edit Prep Method')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('diced')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockDicedId);
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'diced');
        await user.click(screen.getByLabelText('Name'));
        await user.keyboard('{Backspace}y');
        await user.click(screen.getByLabelText('Save prep method'));
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockSlicedId);
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockDicedId);

        // Expect
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'dicey');
    });

    it('should not save an update to a prep method', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        expect(await screen.findByText('Edit Prep Method')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('diced')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockDicedId);
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'diced');
        await user.click(screen.getByLabelText('Name'));
        await user.keyboard('{Backspace}y');
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockSlicedId);
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockDicedId);

        // Expect
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'diced');
    });

    it('should remove a prep method', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockDeletePrepMethod]);

        // Act
        expect(await screen.findByText('Edit Prep Method')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('diced')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockDicedId);
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'diced');
        await user.click(screen.getByLabelText('Delete prep method'));
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockSlicedId);

        // Expect
        expect(screen.queryByLabelText('whole')).not.toBeNull();
        expect(screen.queryByLabelText('teaspoon')).toBeNull();
    });
});
