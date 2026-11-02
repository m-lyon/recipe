import { createRef } from 'react';
import { MantineProvider } from '@mantine/core';
import { ChakraProvider } from '@chakra-ui/react';
import { userEvent } from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';

import { theme } from '@recipe/theme';
import { getCache } from '@recipe/utils/cache';
import { MockedResponses } from '@recipe/utils/tests';
import { CURRENT_USER } from '@recipe/graphql/queries/user';
import { mockCup } from '@recipe/graphql/queries/__mocks__/unit';
import { mockUser } from '@recipe/graphql/queries/__mocks__/user';
import { EnumNutritionalInfoSource } from '@recipe/graphql/generated';
import { carrotCupGrams } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockAppleId, mockCarrotId, mockDicedId } from '@recipe/graphql/__mocks__/ids';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { carrotLabelPer100 } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockUsdaSearchNoMatches } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { offPearlCouscousBarcode } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaSearchChickenBreast } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockUsdaFoodItemChickenBreast } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockOpenFoodFactsSearchCouscous } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockOpenFoodFactsProductCouscous } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockOpenFoodFactsProductNotFound } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockCreateNutritionalInfoCarrotUsda } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockUpdateNutritionalInfoCarrotDiced } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockDeleteNutritionalInfoCarrotDiced } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockCreateNutritionalInfoCarrotManual } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockCreateNutritionalInfoCarrotChopped } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockOpenFoodFactsSearchCouscousAllCountries } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockCreateNutritionalInfoCarrotOpenFoodFacts } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockCreateNutritionalInfoCarrotManualPer100ml } from '@recipe/graphql/mutations/__mocks__/nutritionalInfo';
import { mockGetNutritionalInfosForEditIngredientCarrotDicedOnly } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { ExistingNutritionalInfo } from '../nutritionTypes';
import { NutritionLinkSectionProps } from '../NutritionLinkSection';
import { NutritionLinkSection, NutritionLinkSectionHandle } from '../NutritionLinkSection';

loadErrorMessages();
loadDevMessages();

type User = ReturnType<typeof userEvent.setup>;

function section(
    props: Partial<NutritionLinkSectionProps>,
    ref = createRef<NutritionLinkSectionHandle>()
) {
    return (
        <MantineProvider theme={theme} env='test'>
            <ChakraProvider>
                <NutritionLinkSection
                    ref={ref}
                    ingredientId={mockCarrotId}
                    ingredientName='carrot'
                    {...props}
                />
            </ChakraProvider>
        </MantineProvider>
    );
}

function renderSection(
    mocks: MockedResponses,
    props: Partial<NutritionLinkSectionProps> = {},
    cache = getCache()
) {
    const ref = createRef<NutritionLinkSectionHandle>();
    const result = render(
        <MockedProvider mocks={[mockGetIngredientComponents, ...mocks]} cache={cache}>
            {section(props, ref)}
        </MockedProvider>
    );
    return { ...result, ref };
}

/** The editor of the plain record, or of one prep method. */
const record = (prep?: string) =>
    within(
        screen.getByRole('group', {
            name: prep ? `Nutritional data · ${prep}` : 'Nutritional data',
        })
    );

async function pickRecord(user: User, name: string) {
    await user.click(screen.getByLabelText('Values for'));
    await user.click(await screen.findByRole('option', { name }));
}

async function chooseSource(user: User, label: string, prep?: string) {
    await user.click(record(prep).getByLabelText(label));
}

/** Types a query, searches, and selects the single result, which also fires the
 *  single-item query that carries the portions. */
async function searchUsdaAndSelect(user: User, query: string, resultText: string) {
    await user.clear(screen.getByLabelText('Search nutritional data'));
    await user.type(screen.getByLabelText('Search nutritional data'), query);
    await user.click(screen.getByLabelText('Search USDA database'));
    await user.click(await screen.findByText(resultText));
}

async function enterManually(user: User, values: typeof carrotLabelPer100, prep?: string) {
    const scope = record(prep);
    await user.type(scope.getByLabelText('Calories (kcal)'), String(values.calories));
    await user.type(scope.getByLabelText('Protein (g)'), String(values.protein));
    await user.type(scope.getByLabelText('Carbs (g)'), String(values.carbs));
    await user.type(scope.getByLabelText('Fat (g)'), String(values.fat));
}

/** Runs the staged commit, and expects one call of each spy. */
async function commit(ref: React.RefObject<NutritionLinkSectionHandle | null>) {
    await act(async () => {
        await ref.current!.commitChanges(mockCarrotId);
    });
}

const dicedInfos = mockGetNutritionalInfosForEditIngredientCarrotDicedOnly.result.data
    .nutritionalInfosByIngredientIds as ExistingNutritionalInfo[];

describe('NutritionLinkSection USDA search', () => {
    afterEach(() => {
        cleanup();
    });

    it('should search the text just typed, without waiting', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchChickenBreast]);

        // No pause between the last keystroke and the click: the mock only answers
        // the full query, so a stale value would leave the list empty.
        await user.clear(screen.getByLabelText('Search nutritional data'));
        await user.type(screen.getByLabelText('Search nutritional data'), 'chicken breast');
        await user.click(screen.getByLabelText('Search USDA database'));

        expect(await screen.findByText('Chicken breast, cooked')).not.toBeNull();
    });

    it('should say so when a search returns no matches', async () => {
        const user = userEvent.setup();
        renderSection([mockUsdaSearchNoMatches]);

        expect(screen.queryByText(/No matches found/)).toBeNull();
        await user.clear(screen.getByLabelText('Search nutritional data'));
        await user.type(screen.getByLabelText('Search nutritional data'), 'zzzzz');
        await user.click(screen.getByLabelText('Search USDA database'));

        expect(await screen.findByText(/No matches found/)).not.toBeNull();
    });

    it('should report a failed search as a failure, not as no matches', async () => {
        const user = userEvent.setup();
        renderSection([
            { request: mockUsdaSearchNoMatches.request, error: new Error('USDA is down') },
        ]);

        await user.clear(screen.getByLabelText('Search nutritional data'));
        await user.type(screen.getByLabelText('Search nutritional data'), 'zzzzz');
        await user.click(screen.getByLabelText('Search USDA database'));

        expect(await screen.findByText(/The search failed: USDA is down/)).not.toBeNull();
        expect(screen.queryByText(/No matches found/)).toBeNull();
    });

    it('should link nothing once the selection is cleared, and keep the results', async () => {
        const user = userEvent.setup();
        // No mock for a write: a request would fail the test with a warning.
        const { ref } = renderSection([mockUsdaSearchChickenBreast, mockUsdaFoodItemChickenBreast]);
        await searchUsdaAndSelect(user, 'chicken breast', 'Chicken breast, cooked');

        await user.click(screen.getByLabelText('Clear nutritional data selection'));

        expect(screen.getByText('Chicken breast, cooked')).not.toBeNull();
        expect(screen.queryByLabelText('Clear nutritional data selection')).toBeNull();
        await commit(ref);
    });

    it('should save a USDA link with its source and FDC ID', async () => {
        const user = userEvent.setup();
        const created = vi.fn(() => mockCreateNutritionalInfoCarrotUsda.result);
        const { ref } = renderSection([
            mockUsdaSearchChickenBreast,
            mockUsdaFoodItemChickenBreast,
            { ...mockCreateNutritionalInfoCarrotUsda, result: created },
        ]);
        await searchUsdaAndSelect(user, 'chicken breast', 'Chicken breast, cooked');

        await commit(ref);

        expect(created).toHaveBeenCalledTimes(1);
    });
});

describe('NutritionLinkSection portions for the measures list', () => {
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

        await searchUsdaAndSelect(user, 'chicken breast', 'Chicken breast, cooked');

        await waitFor(() => expect(onPortionsChange.mock.lastCall?.[0].length).toBeGreaterThan(0));
        const linked = onPortionsChange.mock.lastCall![0];
        expect(
            linked.map((p: { portion: { description: string } }) => p.portion.description)
        ).toContain('1 breast');
        expect(linked[0]).toMatchObject({ prepMethodId: null, source: 'usda' });
        expect(onPerGramChange.mock.lastCall?.[0].get(null).calories).toBeCloseTo(1.65);
    });

    it('should report no portions once the ingredient changes', async () => {
        const user = userEvent.setup();
        const onPortionsChange = vi.fn();
        const mocks = [
            mockGetIngredientComponents,
            mockUsdaSearchChickenBreast,
            mockUsdaFoodItemChickenBreast,
        ];
        const { rerender } = render(
            <MockedProvider mocks={mocks} cache={getCache()}>
                {section({ onPortionsChange })}
            </MockedProvider>
        );
        await searchUsdaAndSelect(user, 'chicken breast', 'Chicken breast, cooked');
        await waitFor(() => expect(onPortionsChange.mock.lastCall?.[0].length).toBeGreaterThan(0));

        rerender(
            <MockedProvider mocks={mocks} cache={getCache()}>
                {section({ ingredientId: mockAppleId, onPortionsChange })}
            </MockedProvider>
        );

        await waitFor(() => expect(onPortionsChange.mock.lastCall?.[0]).toEqual([]));
    });

    it('should report the portions of a prep record with its prep method', async () => {
        const user = userEvent.setup();
        const onPortionsChange = vi.fn();
        renderSection([mockOpenFoodFactsProductCouscous], {
            existingNutritionalInfos: dicedInfos,
            onPortionsChange,
        });

        await pickRecord(user, 'carrot, diced');
        await user.click(record('diced').getByLabelText('Unlink nutritional data for diced'));
        await chooseSource(user, 'UK products (Open Food Facts)', 'diced');
        await user.type(record('diced').getByLabelText('Barcode'), offPearlCouscousBarcode);
        await user.click(record('diced').getByLabelText('Look up barcode'));

        await waitFor(() => expect(onPortionsChange.mock.lastCall?.[0].length).toBe(1));
        expect(onPortionsChange.mock.lastCall![0][0]).toMatchObject({
            prepMethodId: mockDicedId,
            source: 'openFoodFacts',
        });
    });
});

describe('NutritionLinkSection Open Food Facts', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show each product with its brand, quantity and macros', async () => {
        const user = userEvent.setup();
        renderSection([mockOpenFoodFactsSearchCouscous]);
        await chooseSource(user, 'UK products (Open Food Facts)');

        await user.clear(screen.getByLabelText('Search products'));
        await user.type(screen.getByLabelText('Search products'), 'couscous{Enter}');

        expect(await screen.findByText('Pearl Couscous')).not.toBeNull();
        expect(screen.getByText("Al'fez · 200 g")).not.toBeNull();
        expect(
            screen.getByText('356 kcal · 12 g protein · 72 g carbs · 1.5 g fat per 100 g')
        ).not.toBeNull();
    });

    it('should mark a product with a missing macro', async () => {
        const user = userEvent.setup();
        renderSection([mockOpenFoodFactsSearchCouscous]);
        await chooseSource(user, 'UK products (Open Food Facts)');
        await user.clear(screen.getByLabelText('Search products'));
        await user.type(screen.getByLabelText('Search products'), 'couscous');
        await user.click(screen.getByLabelText('Search Open Food Facts'));

        expect(await screen.findByLabelText('Warning: No value for fat')).not.toBeNull();
        expect(screen.getAllByLabelText(/^Warning:/)).toHaveLength(1);

        await user.click(screen.getByText('Giant Couscous'));
        expect(screen.getByText(/No value for fat. Check the values/)).not.toBeNull();
    });

    it('should search all countries once the UK filter is off', async () => {
        const user = userEvent.setup();
        renderSection([mockOpenFoodFactsSearchCouscousAllCountries]);
        await chooseSource(user, 'UK products (Open Food Facts)');

        await user.click(screen.getByLabelText('Search all countries'));
        await user.clear(screen.getByLabelText('Search products'));
        await user.type(screen.getByLabelText('Search products'), 'couscous');
        await user.click(screen.getByLabelText('Search Open Food Facts'));

        expect(await screen.findByText('Pearl Couscous')).not.toBeNull();
        expect(screen.queryByText('Giant Couscous')).toBeNull();
    });

    it('should look up a barcode and save the product', async () => {
        const user = userEvent.setup();
        const created = vi.fn(() => mockCreateNutritionalInfoCarrotOpenFoodFacts.result);
        const onPortionsChange = vi.fn();
        const { ref } = renderSection(
            [
                mockOpenFoodFactsProductCouscous,
                { ...mockCreateNutritionalInfoCarrotOpenFoodFacts, result: created },
            ],
            { onPortionsChange }
        );
        await chooseSource(user, 'UK products (Open Food Facts)');

        // Digits only: the spaces of a pasted barcode are dropped.
        await user.type(screen.getByLabelText('Barcode'), '5010 3383 0125 5');
        expect(screen.getByLabelText('Barcode')).toHaveProperty('value', offPearlCouscousBarcode);
        await user.type(screen.getByLabelText('Barcode'), '{Enter}');
        expect(await screen.findByText('Pearl Couscous')).not.toBeNull();

        expect(onPortionsChange.mock.lastCall?.[0][0].portion.description).toBe('1 cup');
        await commit(ref);
        expect(created).toHaveBeenCalledTimes(1);
    });

    it('should link a saved product to its page', async () => {
        renderSection([mockOpenFoodFactsProductCouscous], {
            existingNutritionalInfos: [
                {
                    ...dicedInfos[0],
                    prepMethod: null,
                    source: EnumNutritionalInfoSource.OpenFoodFacts,
                    openFoodFactsBarcode: offPearlCouscousBarcode,
                    sourceName: "Al'fez · Pearl Couscous",
                },
            ],
        });

        // Expect -- the product page link gives the ODbL attribution
        expect(screen.getByText(/Linked: Al'fez · Pearl Couscous/)).not.toBeNull();
        const link = screen.getByRole('link', {
            name: `Open Food Facts ${offPearlCouscousBarcode}`,
        });
        expect(link.getAttribute('href')).toBe(
            `https://world.openfoodfacts.org/product/${offPearlCouscousBarcode}`
        );
        // The saved product's portions come from a lookup.
        await waitFor(() => expect(screen.queryByText('Pearl Couscous')).toBeNull());
    });

    it('should refuse a barcode whose check digit is wrong, with no request', async () => {
        const user = userEvent.setup();
        // No mock for the lookup: a request would fail the test with a warning.
        renderSection([]);
        await chooseSource(user, 'UK products (Open Food Facts)');

        await user.type(screen.getByLabelText('Barcode'), '5010338301256');
        await user.click(screen.getByLabelText('Look up barcode'));

        expect(screen.getByText(/5010338301256 is not a valid barcode/)).not.toBeNull();
    });

    it('should say so when no product has the barcode', async () => {
        const user = userEvent.setup();
        renderSection([mockOpenFoodFactsProductNotFound]);
        await chooseSource(user, 'UK products (Open Food Facts)');

        await user.type(screen.getByLabelText('Barcode'), '5012345678900');
        await user.click(screen.getByLabelText('Look up barcode'));

        expect(
            await screen.findByText('No Open Food Facts product with barcode 5012345678900')
        ).not.toBeNull();
    });
});

describe('NutritionLinkSection source switch', () => {
    afterEach(() => {
        cleanup();
    });

    it('should remember the last source the user chose', async () => {
        const user = userEvent.setup();
        const cache = getCache();
        cache.writeQuery({
            query: CURRENT_USER,
            data: { __typename: 'Query', currentUser: mockUser },
        });
        const { unmount } = renderSection([], {}, cache);
        expect(screen.getByLabelText('Generic foods (USDA)')).toHaveProperty('checked', true);

        await chooseSource(user, 'Enter manually');
        unmount();
        renderSection([], {}, cache);

        expect(screen.getByLabelText('Enter manually')).toHaveProperty('checked', true);
    });
});

describe('NutritionLinkSection manual entry', () => {
    afterEach(() => {
        cleanup();
    });

    it('should save values per 100 g with their source', async () => {
        const user = userEvent.setup();
        const created = vi.fn(() => mockCreateNutritionalInfoCarrotManual.result);
        const { ref } = renderSection([
            { ...mockCreateNutritionalInfoCarrotManual, result: created },
        ]);
        await chooseSource(user, 'Enter manually');

        await enterManually(user, carrotLabelPer100);
        await user.type(screen.getByLabelText('Source'), 'Tesco pack label');

        await commit(ref);
        expect(created).toHaveBeenCalledTimes(1);
    });

    it('should convert values per 100 ml with the volume measure', async () => {
        const user = userEvent.setup();
        const created = vi.fn(() => mockCreateNutritionalInfoCarrotManualPer100ml.result);
        const { ref } = renderSection(
            [{ ...mockCreateNutritionalInfoCarrotManualPer100ml, result: created }],
            {
                measures: [
                    { unit: mockCup, sizeId: null, prepMethodId: null, grams: carrotCupGrams },
                ],
            }
        );
        await chooseSource(user, 'Enter manually');

        await user.click(screen.getByLabelText('per 100 ml'));
        await enterManually(user, carrotLabelPer100);

        await commit(ref);
        expect(created).toHaveBeenCalledTimes(1);
    });

    it('should link nothing until all four values are entered', async () => {
        const user = userEvent.setup();
        // No mock for a write: a request would fail the test with a warning.
        const { ref } = renderSection([]);
        await chooseSource(user, 'Enter manually');

        await user.type(screen.getByLabelText('Calories (kcal)'), '41');

        expect(screen.getByText('Enter all four values to use them.')).not.toBeNull();
        await commit(ref);
    });

    it('should not convert values per 100 ml with no volume measure', async () => {
        const user = userEvent.setup();
        // No mock for a write: a request would fail the test with a warning.
        const { ref } = renderSection([]);
        await chooseSource(user, 'Enter manually');

        await user.click(screen.getByLabelText('per 100 ml'));
        await enterManually(user, carrotLabelPer100);

        expect(screen.getByText(/carrot has no volume measure/)).not.toBeNull();
        expect(screen.getByText(/Add one in the measures list/)).not.toBeNull();
        await commit(ref);
    });

    it('should warn when the kcal does not match the macros', async () => {
        const user = userEvent.setup();
        renderSection([]);
        await chooseSource(user, 'Enter manually');

        // Protein and carbs swapped with kcal: 4·41 + 4·9.6 + 9·0.2 is far from 0.9 kcal.
        await enterManually(user, { calories: 0.9, protein: 41, carbs: 9.6, fat: 0.2 });

        expect(
            screen.getByText(/0.9 kcal does not match the macros \(about 204 kcal\)/)
        ).not.toBeNull();
    });
});

describe('NutritionLinkSection prep records', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show the plain record first, and a prep record once picked', async () => {
        const user = userEvent.setup();
        renderSection([], { existingNutritionalInfos: dicedInfos });

        expect(record().getByLabelText('Search nutritional data')).not.toBeNull();
        expect(screen.queryByRole('group', { name: 'Nutritional data · diced' })).toBeNull();

        await pickRecord(user, 'carrot, diced');
        expect(record('diced').getByText('Entered manually · Pack label')).not.toBeNull();
        expect(screen.queryByRole('group', { name: 'Nutritional data' })).toBeNull();
    });

    it('should add values for a prep method as a record of its own', async () => {
        const user = userEvent.setup();
        const created = vi.fn(() => mockCreateNutritionalInfoCarrotChopped.result);
        const { ref } = renderSection([
            { ...mockCreateNutritionalInfoCarrotChopped, result: created },
        ]);

        await pickRecord(user, 'carrot, chopped');
        await chooseSource(user, 'Enter manually', 'chopped');
        await enterManually(user, carrotLabelPer100, 'chopped');
        await pickRecord(user, 'carrot');
        expect(
            screen.getByRole('option', { name: 'carrot, chopped', hidden: true })
        ).not.toBeNull();

        // The plain record is unlinked, so it writes nothing.
        await commit(ref);
        expect(created).toHaveBeenCalledTimes(1);
    });

    it('should keep the current values when a change is cancelled', async () => {
        const user = userEvent.setup();
        renderSection([], { existingNutritionalInfos: dicedInfos });
        const sourceSwitch = () =>
            record('diced').queryByRole('radiogroup', { name: 'Nutritional data source' });

        await pickRecord(user, 'carrot, diced');
        expect(sourceSwitch()).toBeNull();
        await user.click(screen.getByLabelText('Change nutritional data for diced'));
        expect(sourceSwitch()).not.toBeNull();

        await user.click(screen.getByLabelText('Keep nutritional data for diced'));
        expect(sourceSwitch()).toBeNull();
        expect(record('diced').getByText('Entered manually · Pack label')).not.toBeNull();
    });

    it('should edit a prep record', async () => {
        const user = userEvent.setup();
        const updated = vi.fn(() => mockUpdateNutritionalInfoCarrotDiced.result);
        const onNutritionalInfoChange = vi.fn();
        const { ref } = renderSection(
            [{ ...mockUpdateNutritionalInfoCarrotDiced, result: updated }],
            { existingNutritionalInfos: dicedInfos, onNutritionalInfoChange }
        );

        await pickRecord(user, 'carrot, diced');
        await user.click(screen.getByLabelText('Change nutritional data for diced'));
        await chooseSource(user, 'Enter manually', 'diced');
        await enterManually(user, carrotLabelPer100, 'diced');
        expect(
            record('diced').getByText('The selected values replace these when you save.')
        ).not.toBeNull();

        await commit(ref);
        expect(updated).toHaveBeenCalledTimes(1);
        expect(onNutritionalInfoChange).toHaveBeenCalledTimes(1);
    });

    it('should unlink one prep record without touching the others', async () => {
        const user = userEvent.setup();
        const deleted = vi.fn(() => mockDeleteNutritionalInfoCarrotDiced.result);
        const { ref } = renderSection(
            [{ ...mockDeleteNutritionalInfoCarrotDiced, result: deleted }],
            { existingNutritionalInfos: dicedInfos }
        );

        await pickRecord(user, 'carrot, diced');
        await user.click(screen.getByLabelText('Unlink nutritional data for diced'));

        // Staged: nothing is deleted until the ingredient is saved.
        expect(deleted).not.toHaveBeenCalled();
        await commit(ref);
        expect(deleted).toHaveBeenCalledTimes(1);
    });

    it('should keep a prep record when its unlink is undone', async () => {
        const user = userEvent.setup();
        // No mock for a write: a request would fail the test with a warning.
        const { ref } = renderSection([], { existingNutritionalInfos: dicedInfos });

        await pickRecord(user, 'carrot, diced');
        await user.click(screen.getByLabelText('Unlink nutritional data for diced'));
        expect(record('diced').queryByText('Entered manually · Pack label')).toBeNull();
        await user.click(screen.getByLabelText('Undo unlink for diced'));

        expect(record('diced').getByText('Entered manually · Pack label')).not.toBeNull();
        await commit(ref);
    });
});
