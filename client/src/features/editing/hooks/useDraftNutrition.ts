import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useDebounce } from 'use-debounce';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';
import { submittableNutritionOverride } from '@recipe/utils/nutritionOverride';
import { GET_RECIPE_NUTRITION_PREVIEW } from '@recipe/graphql/queries/nutritionalInfo';
import { NutritionDraftIngredientInput, UncountedCode } from '@recipe/graphql/generated';

/** Long enough that a burst of edits sends one request. */
const DEBOUNCE_MS = 400;

const ZERO: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * A draft line in the shape the nutrition panel shows. A recipe used as an ingredient has no
 * titleIdentifier here, so the panel shows no link for it.
 */
function asView(item: FinishedRecipeIngredient): RecipeIngredientView {
    return {
        __typename: 'RecipeIngredient',
        _id: item.key,
        quantity: item.quantity,
        unit: item.unit,
        size: item.size,
        ingredient: item.ingredient,
        prepMethod: item.prepMethod,
        nutritionOverride: item.nutritionOverride
            ? { __typename: 'RecipeIngredientNutritionOverride', ...item.nutritionOverride }
            : null,
    } as RecipeIngredientView;
}

/** The nutrition of the recipe being edited, as it stands, including what is not saved. */
export function useDraftNutrition(recipeId: string | undefined, enabled: boolean) {
    const { sections, numServings } = useRecipeStore(
        useShallow((state) => ({
            sections: state.ingredientSections,
            numServings: state.numServings,
        }))
    );
    const items = useMemo(() => sections.flatMap((section) => section.finished), [sections]);
    const ingredients = useMemo(
        () =>
            items.map(
                (item): NutritionDraftIngredientInput => ({
                    ingredient: item.ingredient._id,
                    quantity: item.quantity ?? undefined,
                    unit: item.unit?._id,
                    size: item.size?._id,
                    prepMethod: item.prepMethod?._id,
                    nutritionOverride: submittableNutritionOverride(item.nutritionOverride),
                })
            ),
        [items]
    );
    const [variables] = useDebounce({ recipeId, ingredients }, DEBOUNCE_MS, {
        equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    });
    const { data, previousData, loading, error } = useQuery(GET_RECIPE_NUTRITION_PREVIEW, {
        variables,
        skip: !enabled || variables.ingredients.length === 0,
    });
    const nutrition = (data ?? previousData)?.recipeNutritionPreview;
    // The debounced request can lag behind the draft, so lines are matched only when the
    // counts agree.
    const results =
        nutrition && nutrition.ingredients.length === items.length ? nutrition.ingredients : [];

    const total = nutrition?.total ?? ZERO;
    const servings = numServings > 0 ? numServings : 1;
    const perServing: MacroNutrients = {
        calories: total.calories / servings,
        protein: total.protein / servings,
        carbs: total.carbs / servings,
        fat: total.fat / servings,
    };
    const uncounted: Array<{ item: RecipeIngredientView; code: UncountedCode; reason: string }> =
        [];
    const partial: Array<{ item: RecipeIngredientView; reason: string }> = [];
    results.forEach((result, index) => {
        if (!result.reason) return;
        const item = asView(items[index]);
        if (result.status === 'UNCOUNTED') {
            uncounted.push({ item, code: result.reason.code, reason: result.reason.message });
        } else if (result.status === 'PARTIAL') {
            partial.push({ item, reason: result.reason.message });
        }
    });

    return {
        hasIngredients: items.length > 0,
        perServing,
        uncounted,
        partial,
        uncountedIds: new Set(uncounted.map((ingredient) => ingredient.item._id)),
        nothingCounted:
            !!nutrition && nutrition.ingredients.every((result) => result.status === 'UNCOUNTED'),
        loading: loading && !nutrition,
        error: error != null && !nutrition,
    };
}
