import { describe, expect, it } from 'vitest';

import { mockSizes } from '@recipe/graphql/queries/__mocks__/size';
import { mockUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCup, mockEach } from '@recipe/graphql/queries/__mocks__/unit';
import { mockChoppedId, mockLargeId } from '@recipe/graphql/__mocks__/ids';
import { mockPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';

import { suggestFromPortion } from '../portions';
import { UsdaPortion } from '../../components/UsdaLinkSection';

function portion(overrides: Partial<UsdaPortion>): UsdaPortion {
    return {
        __typename: 'UsdaFoodPortion',
        description: '1 large',
        amount: 1,
        modifier: 'large',
        gramWeight: 150,
        kind: 'ITEM',
        millilitres: null,
        impliedDensity: null,
        ambiguous: false,
        ...overrides,
    };
}

const suggest = (p: UsdaPortion) => suggestFromPortion(p, mockUnits, mockSizes, mockPrepMethods);

describe('suggestFromPortion', () => {
    it('maps a size word to each + size', () => {
        expect(suggest(portion({}))).toEqual({
            label: '1 large (150 g)',
            draft: { unitId: mockEach._id, sizeId: mockLargeId, prepMethodId: null, grams: 150 },
        });
    });

    it('finds a size word inside a described item portion', () => {
        const result = suggest(
            portion({
                description: '1 Potato large (3" to 4-1/4" dia)',
                modifier: 'Potato large (3" to 4-1/4" dia)',
                gramWeight: 369,
            })
        );
        expect(result?.draft).toEqual({
            unitId: mockEach._id,
            sizeId: mockLargeId,
            prepMethodId: null,
            grams: 369,
        });
    });

    it('does not read "extra large" as large', () => {
        expect(
            suggest(portion({ description: '1 extra large', modifier: 'extra large' }))?.reason
        ).toBe('no matching unit or size "extra large"');
    });

    it('maps "cup, chopped" to cup + prep method, per one cup', () => {
        const result = suggest(
            portion({
                description: '2 cup, chopped',
                amount: 2,
                modifier: 'cup, chopped',
                gramWeight: 320,
                kind: 'VOLUME',
            })
        );
        expect(result?.draft).toEqual({
            unitId: mockCup._id,
            sizeId: null,
            prepMethodId: mockChoppedId,
            grams: 160,
        });
    });

    it('reads the amount from a Survey label with a numeric modifier code', () => {
        const result = suggest(
            portion({
                description: '1/2 cup',
                amount: null,
                modifier: '60482',
                kind: 'VOLUME',
                gramWeight: 80,
            })
        );
        expect(result?.draft?.grams).toBe(160);
    });

    it('shows the reason when a part has no match', () => {
        expect(
            suggest(portion({ description: '1 slice', modifier: 'slice', gramWeight: 14 }))
        ).toEqual({
            label: '1 slice (14 g)',
            reason: 'no matching unit or size "slice"',
        });
        expect(
            suggest(
                portion({ modifier: 'cup, sifted', description: '1 cup, sifted', kind: 'VOLUME' })
            )?.reason
        ).toBe('no matching prep method "sifted"');
    });

    it('offers no row for a weight, and explains a serving', () => {
        expect(
            suggest(portion({ kind: 'WEIGHT', modifier: 'oz', description: '1 oz' }))
        ).toBeNull();
        expect(
            suggest(portion({ kind: 'SERVING', modifier: null, description: '1 serving' }))?.reason
        ).toBe('a serving size, not one unit');
    });
});
