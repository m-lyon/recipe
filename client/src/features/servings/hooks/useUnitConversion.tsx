import { useQuery } from '@apollo/client';
import { Fraction, MathType, divide, fraction, multiply } from 'mathjs';

import { isFraction } from '@recipe/utils/number';
import { Quantity, UniqueUnit } from '@recipe/types';
import { UnitConversion } from '@recipe/graphql/generated';
import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';

export interface UnitConversionArgs {
    quantity: Quantity;
    unit: UniqueUnit | null;
}
export function useUnitConversion() {
    const { data, loading, error } = useQuery(GET_UNIT_CONVERSIONS);

    const apply = ({ quantity, unit }: UnitConversionArgs): UnitConversionArgs => {
        if (unit == null || quantity == null) {
            return { quantity, unit };
        }
        if (loading || error || !data) {
            return { quantity, unit };
        }
        const unitConversion = data!.unitConversionMany.find((conversion) =>
            conversion.rules.some((rule) => rule?.unit!._id === unit._id)
        );
        if (!unitConversion) {
            return { quantity, unit };
        }
        // Get base conversion factor
        const currentUnit = unitConversion.rules.find((rule) => rule.unit!._id === unit._id);

        if (isFraction(quantity!)) {
            return handleFractionConversion(
                quantity,
                currentUnit!.baseToUnitConversion,
                unitConversion as UnitConversion
            );
        } else {
            return handleFloatConversion(
                quantity,
                currentUnit!.baseToUnitConversion,
                unitConversion as UnitConversion
            );
        }
    };

    return { apply };
}

function handleFractionConversion(
    quantity: Quantity,
    baseToUnitConversion: number,
    unitConversion: UnitConversion
): UnitConversionArgs {
    const baseQuantity = multiply(fraction(quantity!), fraction(baseToUnitConversion)) as Fraction;
    for (const rule of unitConversion.rules) {
        if (baseQuantity >= (rule.baseUnitThreshold as MathType)) {
            const result = divide(baseQuantity, fraction(rule.baseToUnitConversion)) as Fraction;
            return { quantity: `${result.n}/${result.d}`, unit: rule.unit! };
        }
    }
    return {
        quantity: `${baseQuantity.n}/${baseQuantity.d}`,
        unit: unitConversion.baseUnit!,
    };
}

function handleFloatConversion(
    quantity: Quantity,
    baseToUnitConversion: number,
    unitConversion: UnitConversion
): UnitConversionArgs {
    const baseQuantity = parseFloat(quantity!) * baseToUnitConversion;
    for (const rule of unitConversion.rules) {
        if (baseQuantity >= rule.baseUnitThreshold) {
            const result = baseQuantity / rule.baseToUnitConversion;
            return { quantity: result.toString(), unit: rule.unit! };
        }
    }
    return { quantity: baseQuantity.toString(), unit: unitConversion.baseUnit! };
}
