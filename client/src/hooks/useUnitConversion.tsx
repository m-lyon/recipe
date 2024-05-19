import { useQuery } from '@apollo/client';
import { Fraction, MathType, divide, fraction, multiply } from 'mathjs';

import { ConversionRule, RecipeIngredient, Unit } from '@recipe/graphql/generated';
import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { isFraction } from '@recipe/utils/number';

export function useUnitConversion() {
    const { data, loading, error } = useQuery(GET_UNIT_CONVERSIONS);

    const apply = (ingr: RecipeIngredient): RecipeIngredient => {
        const { quantity, unit } = ingr;
        if (unit == null) {
            return ingr;
        }
        if (loading || error) {
            return ingr;
        }
        const unitConversion = data!.unitConversionMany.find((conversion) =>
            conversion.rules.some((rule) => rule?.unit!._id === unit._id)
        );
        if (!unitConversion) {
            return ingr;
        }
        // sort rules by threshold in descending order
        unitConversion.rules.sort((a, b) => b.threshold - a.threshold);
        // Get base conversion factor
        const currentUnit = unitConversion.rules.find((rule) => rule.unit!._id === unit._id);

        if (isFraction(quantity!)) {
            return handleFractionConversion(
                ingr,
                currentUnit!.baseConversion,
                unitConversion.rules
            );
        } else {
            return handleFloatConversion(ingr, currentUnit!.baseConversion, unitConversion.rules);
        }
    };

    return { apply };
}

function handleFractionConversion(
    ingr: RecipeIngredient,
    baseConversion: number,
    rules: ConversionRule[]
): RecipeIngredient {
    const baseQuantity = multiply(fraction(ingr.quantity!), fraction(baseConversion)) as Fraction;
    for (const rule of rules) {
        if (baseQuantity >= (rule.threshold as MathType)) {
            const result = divide(baseQuantity, fraction(rule.baseConversion)) as Fraction;
            return { ...ingr, quantity: `${result.n}/${result.d}`, unit: rule.unit as Unit };
        }
    }
    throw new Error('No conversion rule matched');
}

function handleFloatConversion(
    ingr: RecipeIngredient,
    baseConversion: number,
    rules: ConversionRule[]
): RecipeIngredient {
    const baseQuantity = parseFloat(ingr.quantity!) * baseConversion;
    for (const rule of rules) {
        if (baseQuantity >= rule.threshold) {
            const result = baseQuantity / rule.baseConversion;
            return { ...ingr, quantity: result.toString(), unit: rule.unit as Unit };
        }
    }
    throw new Error('No conversion rule matched');
}
