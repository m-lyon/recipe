import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { mockDicedId, mockSlicedId } from '@recipe/graphql/__mocks__/ids';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockUpdatePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockDeletePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';

import { EditPrepMethod } from '../EditPrepMethod';

loadErrorMessages();
loadDevMessages();

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<EditPrepMethod />} />)
);

const renderComponent = (
    mocks: MockedResponse<Record<string, any>, Record<string, any>>[] = []
) => {
    render(
        <MockedProvider mocks={[mockGetPrepMethods, ...mocks]}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
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
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockDicedId);
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'diced');
        await user.click(screen.getByLabelText('Delete prep method'));
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockSlicedId);

        // Expect
        expect(screen.queryByLabelText('whole')).not.toBeNull();
        expect(screen.queryByLabelText('teaspoon')).toBeNull();
    });
});
