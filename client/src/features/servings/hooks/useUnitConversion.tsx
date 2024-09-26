import { useQuery } from '@apollo/client';
import { Fraction, MathType, divide, fraction, multiply } from 'mathjs';

import { Quantity } from '@recipe/types';
import { isFraction, isRange } from '@recipe/utils/number';
import { Unit, UnitConversion } from '@recipe/graphql/generated';
import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { returnQuantityFromFloat, returnQuantityFromFraction } from '@recipe/utils/quantity';

export interface UnitConversionArgs {
    quantity: Quantity;
    unit: Unit | null;
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
        return applyConversion(quantity, currentUnit!.baseToUnitConversion, unitConversion);
    };

    return { apply };
}

function applyConversion(
    quantity: string,
    baseToUnitConversion: number,
    unitConversion: UnitConversion
): UnitConversionArgs {
    if (isRange(quantity)) {
        const [start, end] = quantity!.split('-');
        const startConversion = applyConversion(start, baseToUnitConversion, unitConversion);
        const endConversion = applyConversion(end, baseToUnitConversion, unitConversion);
        return {
            quantity: `${startConversion.quantity}-${endConversion.quantity}`,
            unit: startConversion.unit,
        };
    }
    if (isFraction(quantity)) {
        return applyFractionConversion(quantity, baseToUnitConversion, unitConversion);
    } else {
        return applyFloatConversion(quantity, baseToUnitConversion, unitConversion);
    }
}

function applyFractionConversion(
    quantity: string,
    baseToUnitConversion: number,
    unitConversion: UnitConversion
): UnitConversionArgs {
    const baseQuantity = multiply(fraction(quantity!), fraction(baseToUnitConversion)) as Fraction;
    for (const rule of unitConversion.rules) {
        if (baseQuantity >= (rule.baseUnitThreshold as MathType)) {
            const result = divide(baseQuantity, fraction(rule.baseToUnitConversion)) as Fraction;
            return { quantity: returnQuantityFromFraction(result, rule.unit!), unit: rule.unit! };
        }
    }
    return {
        quantity: returnQuantityFromFraction(baseQuantity, unitConversion.baseUnit!),
        unit: unitConversion.baseUnit!,
    };
}

function applyFloatConversion(
    quantity: string,
    baseToUnitConversion: number,
    unitConversion: UnitConversion
): UnitConversionArgs {
    const baseQuantity = parseFloat(quantity!) * baseToUnitConversion;
    for (const rule of unitConversion.rules) {
        if (baseQuantity >= rule.baseUnitThreshold) {
            const result = baseQuantity / rule.baseToUnitConversion;
            return { quantity: returnQuantityFromFloat(result, rule.unit!), unit: rule.unit! };
        }
    }
    return {
        quantity: returnQuantityFromFloat(baseQuantity, unitConversion.baseUnit!),
        unit: unitConversion.baseUnit!,
    };
}
