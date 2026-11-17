import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';

import { NutritionOverrideForm } from '../NutritionOverrideForm';

const units = mockGetIngredientComponents.result.data.units.filter((unit) => unit.unique);
const teaspoon = units.find((unit) => unit.longSingular === 'teaspoon')!;

function renderForm(props: Partial<Parameters<typeof NutritionOverrideForm>[0]> = {}) {
    const onApply = vi.fn();
    render(
        <ChakraProvider>
            <NutritionOverrideForm
                override={null}
                hasQuantity={false}
                defaultUnit={teaspoon}
                units={units}
                onApply={onApply}
                {...props}
            />
        </ChakraProvider>
    );
    return onApply;
}

describe('NutritionOverrideForm', () => {
    afterEach(() => {
        cleanup();
    });

    it('offers no share of a line with no quantity, and starts on a set amount', async () => {
        const onApply = renderForm();
        const user = userEvent.setup();

        expect(screen.queryByLabelText('Count part of it')).toBeNull();
        expect(screen.getByLabelText('Leave it uncounted')).not.toBeNull();
        await user.type(screen.getByLabelText('Amount to count'), '1/4');
        await user.click(screen.getByRole('button', { name: 'Apply' }));

        expect(onApply).toHaveBeenCalledWith({
            mode: 'amount',
            percent: null,
            quantity: '1/4',
            unit: teaspoon,
        });
    });

    it('counts a line that is too small as negligible', async () => {
        const onApply = renderForm();
        const user = userEvent.setup();

        await user.click(screen.getByLabelText('Too small to count'));
        await user.click(screen.getByRole('button', { name: 'Apply' }));

        expect(onApply).toHaveBeenCalledWith({
            mode: 'negligible',
            percent: null,
            quantity: null,
            unit: null,
        });
    });

    it('clears an override when the whole line counts again', async () => {
        const onApply = renderForm({
            hasQuantity: true,
            override: { mode: 'share', percent: 15, quantity: null, unit: null },
        });
        const user = userEvent.setup();

        expect(screen.getByLabelText('Percentage to count')).toHaveProperty('value', '15');
        await user.click(screen.getByLabelText('Count all of it'));
        await user.click(screen.getByRole('button', { name: 'Apply' }));

        expect(onApply).toHaveBeenCalledWith(null);
    });

    it('does not apply a share over 100%', async () => {
        renderForm({ hasQuantity: true });
        const user = userEvent.setup();

        await user.click(screen.getByLabelText('Count part of it'));
        await user.type(screen.getByLabelText('Percentage to count'), '150');

        expect(screen.getByRole('button', { name: 'Apply' })).toHaveProperty('disabled', true);
    });
});
