import { Fraction, fraction, multiply } from 'mathjs';

import { EnumUnitPreferredNumberFormat, RecipeIngredient } from '@recipe/graphql/generated';

export function changeQuantity(
    ingr: RecipeIngredient,
    newServings: number,
    oldServings: number,
    unitConversion: (ingr: RecipeIngredient) => RecipeIngredient
): RecipeIngredient {
    if (newServings === oldServings || ingr.quantity == null) {
        return ingr;
    }
    const result = multiply(
        fraction(ingr.quantity),
        fraction(newServings / oldServings)
    ) as Fraction;
    if (result.d === 1) {
        return unitConversion(handleInteger(result, ingr));
    } else {
        return unitConversion(handleFraction(result, ingr));
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

function handleInteger(result: Fraction, ingr: RecipeIngredient) {
    return { ...ingr, quantity: result.toString() };
}
