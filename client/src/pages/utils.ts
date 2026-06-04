export function queryIngredientToFinished(ingr: RecipeIngredientView): FinishedRecipeIngredient {
    const { quantity, unit, size, ingredient, prepMethod } = ingr;
    const key = crypto.randomUUID();
    if (
        quantity === undefined ||
        unit === undefined ||
        size === undefined ||
        ingredient == undefined ||
        prepMethod === undefined
    ) {
        throw new Error('One or more property is undefined');
    }
    return { key, quantity, unit, size, ingredient, prepMethod };
}
