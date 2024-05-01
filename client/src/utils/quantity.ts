import { fraction, multiply } from 'mathjs';

import { RecipeIngredient } from '@recipe/graphql/generated';

import { isFraction } from './number';

export function changeIngredientQuantity(
    ingr: RecipeIngredient,
    newServings: number,
    oldServings: number
): RecipeIngredient {
    const { quantity } = ingr;
    if (newServings === oldServings || quantity == null) {
        return ingr;
    }
    const factor = fraction(newServings / oldServings);
    if (isFraction(quantity)) {
        const fract = fraction(quantity);
        const newFract = multiply(fract, factor);
        if (newFract.d >= newFract.n) {
            return { ...ingr, quantity: newFract.toString() };
        }
        return { ...ingr, quantity: newFract.toString() };
    }
    const newQuantity = multiply(parseFloat(quantity), factor);
    return { ...ingr, quantity: newQuantity.toString() };
}
