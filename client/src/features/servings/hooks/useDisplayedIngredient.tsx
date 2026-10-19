import { usePreferencesStore } from '@recipe/stores';
import { changeQuantity } from '@recipe/utils/quantity';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

import { useUnitConversion } from './useUnitConversion';

export type DisplayedIngredient<T extends RecipeIngredientView = RecipeIngredientView> = T & {
    authored: string | null;
};

/**
 * Shows a recipe line as the reader sees it: scaled to the current servings, then converted
 * to the reader's unit system.
 */
export function useDisplayedIngredient(currentServings: number, origServings: number) {
    const { apply, convert } = useUnitConversion();
    const unitSystem = usePreferencesStore((state) => state.unitSystem);

    return <T extends RecipeIngredientView>(ingredient: T): DisplayedIngredient<T> => {
        const scaled = changeQuantity(ingredient, currentServings, origServings, apply);
        const converted = convert(scaled, unitSystem);
        const authored = converted.approximate ? getFinishedRecipeIngredientStr(scaled) : null;
        return {
            ...ingredient,
            ...scaled,
            quantity: converted.quantity,
            unit: converted.unit,
            authored,
        };
    };
}
