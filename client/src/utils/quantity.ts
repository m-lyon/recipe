import { Fraction, fraction, multiply } from 'mathjs';

import { UnitConversionArgs } from '@recipe/features/servings';
import { EnumUnitPreferredNumberFormat, RecipeIngredient, Unit } from '@recipe/graphql/generated';

import { isRange } from './number';

export function changeQuantity(
    ingr: RecipeIngredient,
    newServings: number,
    oldServings: number,
    unitConversion: (ingr: UnitConversionArgs) => UnitConversionArgs
): RecipeIngredient {
    if (newServings === oldServings || ingr.quantity == null) {
        return ingr;
    }
    const newQuantity = calculateQuantity(ingr.quantity, newServings, oldServings, ingr.unit!);
    return { ...ingr, ...unitConversion({ quantity: newQuantity, unit: ingr.unit! }) };
}

function calculateQuantity(qty: string, newServ: number, oldServ: number, unit: Unit): string {
    if (isRange(qty)) {
        const [start, end] = qty.split('-');
        const newStart = calculateQuantity(start, newServ, oldServ, unit);
        const newEnd = calculateQuantity(end, newServ, oldServ, unit);
        return `${newStart}-${newEnd}`;
    }
    const result = multiply(fraction(qty), fraction(newServ / oldServ)) as Fraction;
    if (result.d === 1) {
        return handleInteger(result);
    }
    return handleFraction(result, unit);
}

function handleFraction(result: Fraction, unit: Unit): string {
    if (unit == null) {
        return `${result.n}/${result.d}`;
    }
    if (unit?.preferredNumberFormat === EnumUnitPreferredNumberFormat.Fraction) {
        return `${result.n}/${result.d}`;
    }
    return result.toString();
}

function handleInteger(result: Fraction): string {
    return result.toString();
}
