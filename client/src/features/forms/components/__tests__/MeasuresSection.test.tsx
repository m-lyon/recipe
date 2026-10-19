import { createRef } from 'react';
import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

import { theme } from '@recipe/theme';
import { getCache } from '@recipe/utils/cache';
import { MockedResponses } from '@recipe/utils/tests';
import { mockAppleId } from '@recipe/graphql/__mocks__/ids';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { CREATE_INGREDIENT_MEASURE } from '@recipe/graphql/mutations/ingredientMeasure';
import { mockGetIngredientMeasuresFallback } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockCreateMeasureAppleTeaspoon } from '@recipe/graphql/mutations/__mocks__/ingredientMeasure';

import { MeasuresSection, MeasuresSectionHandle, MeasuresSectionProps } from '../MeasuresSection';

loadErrorMessages();
loadDevMessages();

function renderSection(mocks: MockedResponses, props: Partial<MeasuresSectionProps> = {}) {
    const ref = createRef<MeasuresSectionHandle>();
    render(
        <MockedProvider
            mocks={[mockGetIngredientComponents, mockGetIngredientMeasuresFallback, ...mocks]}
            cache={getCache()}
        >
            <MantineProvider theme={theme} env='test'>
                <ChakraProvider>
                    <MeasuresSection
                        ref={ref}
                        ingredientId={mockAppleId}
                        portions={[]}
                        perGram={null}
                        {...props}
                    />
                </ChakraProvider>
            </MantineProvider>
        </MockedProvider>
    );
    return ref;
}

const value = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value;

describe('MeasuresSection', () => {
    afterEach(() => {
        cleanup();
    });

    /** Enters "2 teaspoons = 10 g", which is 5 g per teaspoon. */
    async function addTwoTeaspoons(user: ReturnType<typeof userEvent.setup>) {
        await waitFor(() =>
            expect(screen.getByLabelText('Add measure')).toHaveProperty('disabled', false)
        );
        await user.clear(screen.getByLabelText('Quantity'));
        await user.type(screen.getByLabelText('Quantity'), '2');
        await user.click(screen.getByLabelText('Measure unit'));
        await user.click(await screen.findByRole('option', { name: 'teaspoon' }));
        await user.type(screen.getByLabelText('Grams'), '10');
        await user.click(screen.getByLabelText('Add measure'));
    }

    it('should stage a measure and save it only when the ingredient is saved', async () => {
        const user = userEvent.setup();
        // Only the mock for the commit: an add that sent a request would find no match.
        const ref = renderSection([mockCreateMeasureAppleTeaspoon]);

        await addTwoTeaspoons(user);

        expect(screen.getByText('1 teaspoon = 5 g')).not.toBeNull();
        // The whole new-measure form starts again, unit included.
        expect(value('Quantity')).toBe('1');
        expect(value('Grams')).toBe('');
        expect(value('Measure unit')).toBe('');

        await act(() => ref.current!.commitChanges(mockAppleId));
    });

    it('should keep a staged measure when it fails to save', async () => {
        const user = userEvent.setup();
        const ref = renderSection([
            {
                request: { query: CREATE_INGREDIENT_MEASURE },
                variableMatcher: () => true,
                error: new Error('Network error'),
            },
        ]);

        await addTwoTeaspoons(user);

        await act(async () => {
            await expect(ref.current!.commitChanges(mockAppleId)).rejects.toThrow();
        });
        expect(screen.getByText('1 teaspoon = 5 g')).not.toBeNull();
    });

    it('should mark the fields that stop a measure being added', async () => {
        const user = userEvent.setup();
        renderSection([]);
        await waitFor(() =>
            expect(screen.getByLabelText('Add measure')).toHaveProperty('disabled', false)
        );

        await user.click(screen.getByLabelText('Add measure'));

        expect(screen.getByLabelText('Quantity').getAttribute('aria-invalid')).toBeNull();
        expect(screen.getByLabelText('Measure unit').getAttribute('aria-invalid')).toBe('true');
        expect(screen.getByLabelText('Grams').getAttribute('aria-invalid')).toBe('true');

        await user.type(screen.getByLabelText('Grams'), '5');
        expect(screen.getByLabelText('Grams').getAttribute('aria-invalid')).toBeNull();
    });

    it('should show no default quantity or empty message when disabled', async () => {
        renderSection([], { ingredientId: undefined, disabled: true });

        expect(value('Quantity')).toBe('');
        expect(screen.queryByText(/No measures yet/)).toBeNull();
    });
});
