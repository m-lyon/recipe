import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGramId, mockTeaspoonId } from '@recipe/graphql/__mocks__/ids';
import { mockDeleteUnit, mockUpdateUnit } from '@recipe/graphql/mutations/__mocks__/unit';

import { EditUnit } from '../EditUnit';

loadErrorMessages();
loadDevMessages();

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<EditUnit />} />)
);

const renderComponent = (
    mocks: MockedResponse<Record<string, any>, Record<string, any>>[] = []
) => {
    render(
        <MockedProvider mocks={[mockGetUnits, ...mocks]}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
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
        await user.selectOptions(screen.getByLabelText('Select unit'), mockTeaspoonId);
        expect(screen.getByLabelText('Short singular name')).toHaveProperty('value', 'tsp');
        await user.click(screen.getByLabelText('Delete unit'));
        await user.selectOptions(screen.getByLabelText('Select unit'), mockGramId);

        // Expect
        expect(screen.queryByLabelText('kilogram')).not.toBeNull();
        expect(screen.queryByLabelText('teaspoon')).toBeNull();
    });
});
