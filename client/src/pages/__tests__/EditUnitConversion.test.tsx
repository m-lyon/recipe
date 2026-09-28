import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockRemoveUnitConversionOne } from '@recipe/graphql/mutations/__mocks__/unitConversion';
import { mockRemoveConversionRuleOne } from '@recipe/graphql/mutations/__mocks__/unitConversion';
import { mockRemoveConversionRuleTwo } from '@recipe/graphql/mutations/__mocks__/unitConversion';
import { mockCreateConversionRuleOunce } from '@recipe/graphql/mutations/__mocks__/unitConversion';
import { mockUpdateUnitConversionAddRule } from '@recipe/graphql/mutations/__mocks__/unitConversion';
import { mockUpdateUnitConversionRemoveRule } from '@recipe/graphql/mutations/__mocks__/unitConversion';

import { EditUnitConversion } from '../EditUnitConversion';

loadErrorMessages();
loadDevMessages();

// The page lists every unit, so it queries without a filter
const mockGetAllUnits = { ...mockGetUnits, request: { query: GET_UNITS } };

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditUnitConversion />} />);
    return renderPage(routes, [mockGetAllUnits, mockGetUnitConversions, ...mocks]);
};

describe('Edit Unit Conversion', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add a rule to a unit conversion', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockCreateConversionRuleOunce, mockUpdateUnitConversionAddRule]);

        // Act
        expect(await screen.findByText('Edit Unit Conversion')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit conversion'));
        await user.click(await screen.findByRole('option', { name: 'gram' }));
        expect(screen.getByText('1000 g = 1 kg, g >= 1000')).not.toBeNull();
        await user.selectOptions(screen.getByRole('combobox', { name: 'Unit' }), 'oz');
        await user.clear(screen.getByPlaceholderText('Threshold'));
        await user.type(screen.getByPlaceholderText('Threshold'), '28');
        await user.clear(screen.getByPlaceholderText('Base Conversion'));
        await user.type(screen.getByPlaceholderText('Base Conversion'), '28');
        await user.click(screen.getByRole('button', { name: 'Add Rule' }));

        // Expect
        expect(await screen.findByText('28 g = 1 oz, g >= 28')).not.toBeNull();
        expect(screen.getByText('1000 g = 1 kg, g >= 1000')).not.toBeNull();
    });

    it('should remove a rule from a unit conversion', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockUpdateUnitConversionRemoveRule, mockRemoveConversionRuleTwo]);

        // Act
        expect(await screen.findByText('Edit Unit Conversion')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit conversion'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));
        expect(screen.getByText('3 tsp = 1 tbsp, tsp >= 3')).not.toBeNull();
        await user.click(screen.getByLabelText('Remove tbsp rule'));

        // Expect
        await screen.findByText('48 tsp = 1 cup, tsp >= 12');
        await expect.poll(() => screen.queryByText('3 tsp = 1 tbsp, tsp >= 3')).toBeNull();
    });

    it('should not remove the last rule of a unit conversion', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        expect(await screen.findByText('Edit Unit Conversion')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit conversion'));
        await user.click(await screen.findByRole('option', { name: 'gram' }));
        await user.click(screen.getByLabelText('Remove kg rule'));

        // Expect
        expect(await screen.findByText('Cannot remove the last rule')).not.toBeNull();
        expect(screen.getByText('1000 g = 1 kg, g >= 1000')).not.toBeNull();
    });

    it('should delete a unit conversion', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockRemoveUnitConversionOne, mockRemoveConversionRuleOne]);

        // Act
        expect(await screen.findByText('Edit Unit Conversion')).not.toBeNull();
        await user.click(screen.getByLabelText('Select unit conversion'));
        await user.click(await screen.findByRole('option', { name: 'gram' }));
        await user.click(screen.getByLabelText('Delete unit conversion'));

        // Expect
        expect(await screen.findByText('Unit conversion deleted')).not.toBeNull();
        expect(screen.queryByText('1000 g = 1 kg, g >= 1000')).toBeNull();
        await user.click(screen.getByLabelText('Select unit conversion'));
        expect(await screen.findByRole('option', { name: 'teaspoon' })).not.toBeNull();
        expect(screen.queryByRole('option', { name: 'gram' })).toBeNull();
    });
});
