import { useQuery } from '@apollo/client';

import { MacroNutrients } from '@recipe/utils/macros';
import { UncountedCode } from '@recipe/graphql/generated';
import { GET_RECIPE_NUTRITION } from '@recipe/graphql/queries/nutritionalInfo';

/** A recipe line that added nothing to the totals, and why. */
export interface UncountedIngredient {
    item: RecipeIngredientView;
    code: UncountedCode;
    reason: string;
}

/** A line that uses a recipe with some lines of its own not counted. */
export interface PartialIngredient {
    item: RecipeIngredientView;
    reason: string;
}

const ZERO: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * A recipe's nutrition, as the API calculates it: through recipes used as ingredients, with
 * every line's status. The API reads the whole tree, so the only arithmetic left here is one
 * serving.
 */
export function useNutritionalInfo(recipe: CompletedRecipeView) {
    const lines = recipe.ingredientSubsections.flatMap((subsection) => subsection.ingredients);
    const ingredientIds = [
        ...new Set(
            lines
                .filter((line) => line.ingredient.__typename === 'Ingredient')
                .map((line) => line.ingredient._id)
        ),
    ];
    const { data, loading, error } = useQuery(GET_RECIPE_NUTRITION, {
        variables: { recipeId: recipe._id, ingredientIds },
        // A recipe's figures depend on other recipes and ingredients, which no mutation here
        // updates. Cached figures show at once, and fresh ones replace them.
        fetchPolicy: 'cache-and-network',
    });

    const nutrition = data?.recipeById?.nutrition;
    const total = nutrition?.total ?? ZERO;
    const servings = recipe.numServings > 0 ? recipe.numServings : 1;
    const perServing: MacroNutrients = {
        calories: total.calories / servings,
        protein: total.protein / servings,
        carbs: total.carbs / servings,
        fat: total.fat / servings,
    };

    const itemOf = new Map(lines.map((line) => [line._id, line]));
    const uncounted: UncountedIngredient[] = [];
    const partial: PartialIngredient[] = [];
    for (const line of nutrition?.lines ?? []) {
        const item = itemOf.get(line.recipeIngredient);
        if (!item || !line.reason) continue;
        if (line.status === 'UNCOUNTED') {
            uncounted.push({ item, code: line.reason.code, reason: line.reason.message });
        } else if (line.status === 'PARTIAL') {
            partial.push({ item, reason: line.reason.message });
        }
    }
    const owners = new Map(
        (data?.ingredientByIds ?? []).map((ingredient) => [ingredient._id, ingredient.owner._id])
    );
    const showLoading = loading && !nutrition;
    const nothingCounted =
        !showLoading && (nutrition?.lines ?? []).every((line) => line.status === 'UNCOUNTED');

    return {
        perServing,
        uncounted,
        partial,
        uncountedIds: new Set(uncounted.map((line) => line.item._id)),
        owners,
        nothingCounted,
        loading: showLoading,
        error: error != null && !nutrition,
    };
}
