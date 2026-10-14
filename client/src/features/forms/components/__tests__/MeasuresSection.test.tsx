import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import { theme } from '@recipe/theme';
import { getCache } from '@recipe/utils/cache';
import { MockedResponses } from '@recipe/utils/tests';
import { mockAppleId } from '@recipe/graphql/__mocks__/ids';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { CREATE_INGREDIENT_MEASURE } from '@recipe/graphql/mutations/ingredientMeasure';
import { mockGetIngredientMeasuresFallback } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { MeasuresSection, MeasuresSectionProps } from '../MeasuresSection';

loadErrorMessages();
loadDevMessages();

function renderSection(mocks: MockedResponses, props: Partial<MeasuresSectionProps> = {}) {
    return render(
        <MockedProvider
            mocks={[mockGetIngredientComponents, mockGetIngredientMeasuresFallback, ...mocks]}
            cache={getCache()}
        >
            <MantineProvider theme={theme} env='test'>
                <ChakraProvider>
                    <MeasuresSection
                        ingredientId={mockAppleId}
                        portions={[]}
                        perGram={null}
                        {...props}
                    />
                </ChakraProvider>
            </MantineProvider>
        </MockedProvider>
    );
}

const value = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value;

describe('MeasuresSection', () => {
    afterEach(() => {
        cleanup();
    });

    it('should keep what was typed when the measure fails to save', async () => {
        const user = userEvent.setup();
        renderSection([
            {
                request: { query: CREATE_INGREDIENT_MEASURE },
                variableMatcher: () => true,
                error: new Error('Network error'),
            },
        ]);
        await waitFor(() =>
            expect(screen.getByLabelText('Add measure')).toHaveProperty('disabled', false)
        );

        await user.clear(screen.getByLabelText('Quantity'));
        await user.type(screen.getByLabelText('Quantity'), '2');
        await user.click(screen.getByLabelText('Measure unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));
        await user.type(screen.getByLabelText('Grams'), '9');
        await user.click(screen.getByLabelText('Add measure'));

        await waitFor(() =>
            expect(screen.getByLabelText('Add measure')).toHaveProperty('disabled', false)
        );
        expect(value('Quantity')).toBe('2');
        expect(value('Grams')).toBe('9');
    });

    it('should show no default quantity or empty message when disabled', async () => {
        renderSection([], { ingredientId: undefined, disabled: true });

        expect(value('Quantity')).toBe('');
        expect(screen.queryByText(/No measures yet/)).toBeNull();
    });
});
