import { Fraction, fraction, multiply } from 'mathjs';

import { UnitConversionArgs } from '@recipe/features/servings';
import { EnumUnitPreferredNumberFormat, RecipeIngredient } from '@recipe/graphql/generated';

export function changeQuantity(
    ingr: RecipeIngredient,
    newServings: number,
    oldServings: number,
    unitConversion: (ingr: UnitConversionArgs) => UnitConversionArgs
): RecipeIngredient {
    if (newServings === oldServings || ingr.quantity == null) {
        return ingr;
    }
    const result = multiply(
        fraction(ingr.quantity),
        fraction(newServings / oldServings)
    ) as Fraction;
    if (result.d === 1) {
        const newQuantity = handleInteger(result);
        return { ...ingr, ...unitConversion({ quantity: newQuantity, unit: ingr.unit! }) };
    } else {
        const newQuantity = handleFraction(result, ingr);
        return { ...ingr, ...unitConversion({ quantity: newQuantity, unit: ingr.unit! }) };
    }
}

function handleFraction(result: Fraction, ingr: RecipeIngredient): string {
    if (ingr.unit == null) {
        return `${result.n}/${result.d}`;
    }
    if (ingr.unit?.preferredNumberFormat === EnumUnitPreferredNumberFormat.Fraction) {
        return `${result.n}/${result.d}`;
    }
    return result.toString();
}

function handleInteger(result: Fraction): string {
    return result.toString();
}
