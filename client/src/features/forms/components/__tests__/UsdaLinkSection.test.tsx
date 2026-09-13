import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { theme } from '@recipe/theme';
import { getCache } from '@recipe/utils/cache';
import { MockedResponses, haveValueByLabelText } from '@recipe/utils/tests';
import { mockUsdaSearchBanana } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaSearchOliveOil } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemBanana } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaSearchNoMatches } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemOliveOil } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaSearchChickenBreast } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemChickenBreast } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaSearchChickenDuplicatePortions } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemChickenDuplicatePortions } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

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
});

describe('UsdaLinkSection portion picker', () => {
    afterEach(() => {
        cleanup();
    });

    it('should list only item portions, ambiguous ones last and marked', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            isCountable: true,
        });

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');

        const radios = await screen.findAllByRole('radio', { name: /=/ });
        // The WEIGHT portion ("1 oz") is never offered: it is redundant with perGram.
        // Radio values are index-based (portion descriptions can repeat), so order is
        // asserted through each radio's accessible name instead of its DOM value.
        expect(radios).toHaveLength(2);
        expect(radios[0]).toHaveAccessibleName(/^1 breast/);
        expect(radios[1]).toHaveAccessibleName(/^1 slice/);
        expect(screen.getByText('1 slice = 21 g')).not.toBeNull();
        expect(screen.getByLabelText('Potentially inaccurate portion')).not.toBeNull();
    });

    it('should not preselect any portion', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            isCountable: true,
        });

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');

        const radios = await screen.findAllByRole('radio', { name: /=/ });
        expect(radios.every((r) => !(r as HTMLInputElement).checked)).toBe(true);
        haveValueByLabelText(screen, 'Per unit calories', '0');
    });

    it('should fill the per-unit fields from the chosen portion', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            isCountable: true,
        });

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');
        await user.click(await screen.findByRole('radio', { name: /1 breast/ }));

        // perGram x 172 g: 1.65, 0.31, 0 and 0.036 per gram.
        haveValueByLabelText(screen, 'Per unit calories', '283.8');
        haveValueByLabelText(screen, 'Per unit protein', '53.32');
        haveValueByLabelText(screen, 'Per unit carbs', '0');
        haveValueByLabelText(screen, 'Per unit fat', '6.19');
        expect(screen.getByText(/from selected portion/)).not.toBeNull();
    });

    it('should select the clicked portion by identity, not by description, when two portions share one', async () => {
        const user = userEvent.setup();
        renderSection(
            [mockUsdaSearchChickenDuplicatePortions, mockUsdaFoodItemChickenDuplicatePortions],
            { isCountable: true }
        );

        await searchAndSelect(
            user,
            'chicken dup',
            'Chicken, duplicate portion descriptions'
        );
        const radios = await screen.findAllByRole('radio', { name: /1 serving/ });
        expect(radios).toHaveLength(2);

        // Both portions read "1 serving", so the second radio must resolve to the
        // second (200 g) portion, not fall back to the first (100 g) one.
        await user.click(radios[1]);

        // perGram x 200 g: 1.65, 0.31, 0 and 0.036 per gram.
        haveValueByLabelText(screen, 'Per unit calories', '330');
        haveValueByLabelText(screen, 'Per unit protein', '62');
        haveValueByLabelText(screen, 'Per unit fat', '7.2');
    });

    it('should let a manual edit override a derived value', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            isCountable: true,
        });

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');
        await user.click(await screen.findByRole('radio', { name: /1 breast/ }));

        await user.clear(screen.getByLabelText('Per unit calories'));
        await user.type(screen.getByLabelText('Per unit calories'), '300');

        haveValueByLabelText(screen, 'Per unit calories', '300');
        // The value survives, but it is no longer marked as portion-derived.
        expect(screen.queryByText(/from selected portion/)).toBeNull();
    });

    it('should say plainly when the record has no per-item portion', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchOliveOil, mockUsdaFoodItemOliveOil], { isCountable: true });

        await searchAndSelect(user, 'olive oil', 'Oil, olive, salad or cooking');

        expect(await screen.findByText(/no per-item portion/)).not.toBeNull();
        // No empty picker, and the manual fields remain the way forward.
        expect(screen.queryAllByRole('radio', { name: /=/ })).toHaveLength(0);
        expect(screen.getByLabelText('Per unit calories')).not.toBeNull();
    });

    it('should not render the picker for a non-countable ingredient', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            isCountable: false,
        });

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');

        expect(screen.queryByText('Portion for one unit')).toBeNull();
    });
});

describe('UsdaLinkSection density suggestion', () => {
    afterEach(() => {
        cleanup();
    });

    it('should suggest a density from a volume portion and apply it on request', async () => {
        const user = userEvent.setup();
        const onDensitySuggested = vi.fn();
        // No mutation mocks: any mutation would surface the error alert below.
        renderSection([mockUsdaSearchOliveOil, mockUsdaFoodItemOliveOil], { onDensitySuggested });

        await searchAndSelect(user, 'olive oil', 'Oil, olive, salad or cooking');

        expect(
            await screen.findByText(/Suggested density: 0.91 g\/ml \(from 1 cup = 216 g\)/)
        ).not.toBeNull();

        await user.click(screen.getByLabelText('Apply suggested density'));

        expect(onDensitySuggested).toHaveBeenCalledTimes(1);
        expect(onDensitySuggested.mock.calls[0][0].density).toBeCloseTo(0.913, 3);
        expect(onDensitySuggested.mock.calls[0][0].portionDescription).toBe('1 cup');
        expect(onDensitySuggested.mock.calls[0][0].gramWeight).toBe(216);
        // Applying a density fires no mutation of its own.
        expect(screen.queryByText('Error saving nutritional data')).toBeNull();
    });

    it('should show the suggestion for a countable ingredient too', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchOliveOil, mockUsdaFoodItemOliveOil], { isCountable: true });

        await searchAndSelect(user, 'olive oil', 'Oil, olive, salad or cooking');

        expect(await screen.findByText(/Suggested density/)).not.toBeNull();
    });

    it('should show no suggestion when no portion implies a density', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast], {
            isCountable: true,
        });

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');
        await screen.findAllByRole('radio', { name: /=/ });

        expect(screen.queryByText(/Suggested density/)).toBeNull();
    });

    it('should warn that an ambiguous-only suggestion is a packing density', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchBanana, mockUsdaFoodItemBanana], {});

        await searchAndSelect(user, 'banana', 'Bananas, raw');

        expect(await screen.findByText(/Suggested density: 0.95/)).not.toBeNull();
        expect(screen.getByText(/packing density/)).not.toBeNull();
    });

    it('should suppress the suggestion when the current density is within 10%', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchOliveOil, mockUsdaFoodItemOliveOil], { currentDensity: 0.92 });

        await searchAndSelect(user, 'olive oil', 'Oil, olive, salad or cooking');
        await screen.findByLabelText('Link selected nutritional data');

        expect(screen.queryByText(/Suggested density/)).toBeNull();
    });

    it('should show both values when the current density differs by more than 10%', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchOliveOil, mockUsdaFoodItemOliveOil], { currentDensity: 0.5 });

        await searchAndSelect(user, 'olive oil', 'Oil, olive, salad or cooking');

        expect(await screen.findByText(/Suggested density: 0.91/)).not.toBeNull();
        expect(screen.getByText(/Current density: 0.5 g\/ml/)).not.toBeNull();
    });
});

describe('UsdaLinkSection state reset', () => {
    afterEach(() => {
        cleanup();
    });

    it('should clear portion state when the ingredient changes', async () => {
        const user = userEvent.setup();
        const { rerender } = renderSection(
            [mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast],
            { isCountable: true }
        );

        await searchAndSelect(user, 'chicken breast', 'Chicken breast, cooked');
        await user.click(await screen.findByRole('radio', { name: /1 breast/ }));
        haveValueByLabelText(screen, 'Per unit calories', '283.8');

        rerender(
            <MockedProvider
                mocks={[mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast]}
                cache={getCache()}
            >
                <MantineProvider theme={theme} env='test'>
                    <ChakraProvider>
                        <UsdaLinkSection
                            ingredientId='60f4d2e5c3d5a0a4f1b9c0ea'
                            isCountable={true}
                        />
                    </ChakraProvider>
                </MantineProvider>
            </MockedProvider>
        );

        expect(screen.queryAllByRole('radio', { name: /=/ })).toHaveLength(0);
        expect(screen.queryByLabelText('Per unit calories')).toBeNull();
    });
});
