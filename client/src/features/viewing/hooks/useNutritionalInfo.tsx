import { useQuery } from '@apollo/client';

import { UncountedCode } from '@recipe/graphql/generated';
import { GET_RECIPE_NUTRITION } from '@recipe/graphql/queries/nutritionalInfo';

/** An ingredient that added nothing to the totals, and why. */
export interface UncountedIngredient {
    item: RecipeIngredientView;
    code: UncountedCode;
    reason: string;
}

/** A recipe used as an ingredient, with some ingredients of its own not counted. */
export interface PartialIngredient {
    item: RecipeIngredientView;
    reason: string;
}

const ZERO: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * A recipe's nutrition, as the API calculates it: through recipes used as ingredients, with
 * every ingredient's status. The API reads the whole tree, so the only arithmetic left here is one
 * serving.
 */
export function useNutritionalInfo(recipe: CompletedRecipeView) {
    const recipeIngredients = recipe.ingredientSubsections.flatMap(
        (subsection) => subsection.ingredients
    );
    const ingredientIds = [
        ...new Set(
            recipeIngredients
                .filter((item) => item.ingredient.__typename === 'Ingredient')
                .map((item) => item.ingredient._id)
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

    const itemOf = new Map(recipeIngredients.map((item) => [item._id, item]));
    const uncounted: UncountedIngredient[] = [];
    const partial: PartialIngredient[] = [];
    for (const result of nutrition?.ingredients ?? []) {
        const item = itemOf.get(result.recipeIngredient);
        if (!item || !result.reason) continue;
        if (result.status === 'UNCOUNTED') {
            uncounted.push({ item, code: result.reason.code, reason: result.reason.message });
        } else if (result.status === 'PARTIAL') {
            partial.push({ item, reason: result.reason.message });
        }
    }
    const owners = new Map(
        (data?.ingredientByIds ?? []).map((ingredient) => [ingredient._id, ingredient.owner._id])
    );
    const showLoading = loading && !nutrition;
    const nothingCounted =
        !showLoading &&
        (nutrition?.ingredients ?? []).every((result) => result.status === 'UNCOUNTED');

    return {
        perServing,
        uncounted,
        partial,
        uncountedIds: new Set(uncounted.map((ingredient) => ingredient.item._id)),
        owners,
        nothingCounted,
        loading: showLoading,
        error: error != null && !nutrition,
    };
}
