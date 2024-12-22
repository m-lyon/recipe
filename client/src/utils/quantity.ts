import { Fraction, fraction, multiply } from 'mathjs';

import { UnitConversionArgs } from '@recipe/features/servings';

import { isRange } from './number';

export function changeQuantity(
    ingr: RecipeIngredientView,
    newServings: number,
    oldServings: number,
    unitConversion: (ingr: UnitConversionArgs) => UnitConversionArgs
): RecipeIngredientView {
    if (newServings === oldServings || ingr.quantity == null) {
        return ingr;
    }
    const newQuantity = calculateQuantity(ingr.quantity, newServings, oldServings, ingr.unit);
    return { ...ingr, ...unitConversion({ quantity: newQuantity, unit: ingr.unit }) };
}

function calculateQuantity(
    qty: string,
    newServ: number,
    oldServ: number,
    unit: FinishedUnit
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

export function returnQuantityFromFraction(num: Fraction, unit: FinishedUnit): string {
    if (unit == null || unit.preferredNumberFormat === 'fraction') {
        return num.d === 1 ? num.n.toString() : `${num.n}/${num.d}`;
    }
    return (num.n / num.d).toString();
}

export function returnQuantityFromFloat(num: number, unit: FinishedUnit): string {
    if (unit == null || unit.preferredNumberFormat === 'fraction') {
        const fract = fraction(num);
        return fract.d === 1 ? fract.n.toString() : `${fract.n}/${fract.d}`;
    }
    return num.toString();
}
