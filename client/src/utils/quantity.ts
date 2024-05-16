import { Fraction, fraction, multiply } from 'mathjs';

import { EnumUnitPreferredNumberFormat, RecipeIngredient } from '@recipe/graphql/generated';

export function changeQuantity(
    ingr: RecipeIngredient,
    newServings: number,
    oldServings: number
): RecipeIngredient {
    const { quantity } = ingr;
    if (newServings === oldServings || quantity == null) {
        return ingr;
    }
    const result = multiply(fraction(quantity), fraction(newServings / oldServings)) as Fraction;
    if (result.d === 1) {
        return { ...ingr, quantity: result.toString() };
    } else {
        return handleFraction(result, ingr);
    }
}

function handleFraction(result: Fraction, ingr: RecipeIngredient) {
    if (ingr.unit == null) {
        return { ...ingr, quantity: `${result.n}/${result.d}` };
    }
    if (ingr.unit?.preferredNumberFormat === EnumUnitPreferredNumberFormat.Fraction) {
        return { ...ingr, quantity: `${result.n}/${result.d}` };
    }
    return { ...ingr, quantity: result.toString() };
}
