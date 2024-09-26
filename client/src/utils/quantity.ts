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

function calculateQuantity(
    qty: string,
    newServ: number,
    oldServ: number,
    unit: Unit | null
): string {
    if (isRange(qty)) {
        const [start, end] = qty.split('-');
        const newStart = calculateQuantity(start, newServ, oldServ, unit);
        const newEnd = calculateQuantity(end, newServ, oldServ, unit);
        return `${newStart}-${newEnd}`;
    }
    const result = multiply(fraction(qty), fraction(newServ / oldServ)) as Fraction;
    return returnQuantityFromFraction(result, unit);
}

export function returnQuantityFromFraction(num: Fraction, unit: Unit | null): string {
    if (unit == null || unit.preferredNumberFormat === EnumUnitPreferredNumberFormat.Fraction) {
        return `${num.n}/${num.d}`;
    }
    return (num.n / num.d).toString();
}

export function returnQuantityFromFloat(num: number, unit: Unit | null): string {
    if (unit == null || unit.preferredNumberFormat === EnumUnitPreferredNumberFormat.Fraction) {
        const fract = fraction(num);
        return `${fract.n}/${fract.d}`;
    }
    return num.toString();
}
