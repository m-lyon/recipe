import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import { theme } from '@recipe/theme';
import { getCache } from '@recipe/utils/cache';
import { MockedResponses } from '@recipe/utils/tests';
import { mockUsdaSearchNoMatches } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaSearchChickenBreast } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemChickenBreast } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { UsdaLinkSection, UsdaLinkSectionProps } from '../UsdaLinkSection';

loadErrorMessages();
loadDevMessages();

function renderSection(mocks: MockedResponses, props: Partial<UsdaLinkSectionProps> = {}) {
    return render(
        <MockedProvider mocks={mocks} cache={getCache()}>
            <MantineProvider theme={theme} env='test'>
                <ChakraProvider>
                    <UsdaLinkSection ingredientId='60f4d2e5c3d5a0a4f1b9c0e8' {...props} />
                </ChakraProvider>
            </MantineProvider>
        </MockedProvider>
    );
}

/** Types a query, searches, and selects the single result, which also fires the
 *  single-item query that carries the portions. */
async function searchAndSelect(
    user: ReturnType<typeof userEvent.setup>,
    query: string,
    resultText: string
) {
    await user.type(screen.getByLabelText('Search nutritional data'), query);
    await user.click(screen.getByLabelText('Search USDA database'));
    await user.click(await screen.findByText(resultText));
}

describe('UsdaLinkSection search', () => {
    afterEach(() => {
        cleanup();
    });

    it('should search the text just typed, without waiting', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast]);

        // No pause between the last keystroke and the click: the mock only answers
        // the full query, so a stale value would leave the list empty.
        await user.type(screen.getByLabelText('Search nutritional data'), 'chicken breast');
        await user.click(screen.getByLabelText('Search USDA database'));

        expect(await screen.findByText('Chicken breast, cooked')).not.toBeNull();
    });

    it('should say so when a search returns no matches', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchNoMatches]);

        expect(screen.queryByText(/No matches found/)).toBeNull();
        await user.type(screen.getByLabelText('Search nutritional data'), 'zzzzz');
        await user.click(screen.getByLabelText('Search USDA database'));

        expect(await screen.findByText(/No matches found/)).not.toBeNull();
    });

    it('should report a failed search as a failure, not as no matches', async () => {
        const user = userEvent.setup();
        renderSection([
            { request: mockUsdaSearchNoMatches.request, error: new Error('USDA is down') },
        ]);

        await user.type(screen.getByLabelText('Search nutritional data'), 'zzzzz');
        await user.click(screen.getByLabelText('Search USDA database'));

        expect(await screen.findByText(/The search failed: USDA is down/)).not.toBeNull();
        expect(screen.queryByText(/No matches found/)).toBeNull();
    });
});

describe('UsdaLinkSection unlink', () => {
    afterEach(() => {
        cleanup();
    });

    it('should keep the search and its results after an unlink', async () => {
        const user = userEvent.setup();
        // No ingredient yet, so the link is staged and unlinking needs no request.
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            ingredientId: undefined,
        });
        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');
        await user.click(screen.getByLabelText('Link selected nutritional data'));
        expect(await screen.findByText(/Linked: chicken breast, cooked/)).not.toBeNull();

        await user.click(screen.getByLabelText('Unlink nutritional data'));

        const input = screen.getByLabelText('Search nutritional data') as HTMLInputElement;
        expect(input.value).toBe('chicken breast');
        expect(screen.getByText('Chicken breast, cooked')).not.toBeNull();
        expect(screen.queryByText(/Linked:/)).toBeNull();
    });
});

describe('UsdaLinkSection portions for the measures list', () => {
    afterEach(() => {
        cleanup();
    });

    it('should report the selected item portions and per-gram macros', async () => {
        const user = userEvent.setup();
        const onPortionsChange = vi.fn();
        const onPerGramChange = vi.fn();
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            onPortionsChange,
            onPerGramChange,
        });

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');

        await waitFor(() => expect(onPortionsChange.mock.lastCall?.[0].length).toBeGreaterThan(0));
        const descriptions = onPortionsChange.mock.lastCall![0].map(
            (portion: { description: string }) => portion.description
        );
        expect(descriptions).toContain('1 breast');
        expect(onPerGramChange.mock.lastCall?.[0].calories).toBeCloseTo(1.65);
    });

    it('should report no portions once the ingredient changes', async () => {
        const user = userEvent.setup();
        const onPortionsChange = vi.fn();
        const { rerender } = renderSection(
            [mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast],
            { onPortionsChange }
        );
        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');
        await waitFor(() => expect(onPortionsChange.mock.lastCall?.[0].length).toBeGreaterThan(0));

        rerender(
            <MockedProvider
                mocks={[mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast]}
                cache={getCache()}
            >
                <MantineProvider theme={theme} env='test'>
                    <ChakraProvider>
                        <UsdaLinkSection
                            ingredientId='60f4d2e5c3d5a0a4f1b9c0ea'
                            onPortionsChange={onPortionsChange}
                        />
                    </ChakraProvider>
                </MantineProvider>
            </MockedProvider>
        );

        await waitFor(() => expect(onPortionsChange.mock.lastCall?.[0]).toEqual([]));
    });
});
