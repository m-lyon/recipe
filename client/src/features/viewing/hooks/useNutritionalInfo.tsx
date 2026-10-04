import { useQuery } from '@apollo/client';

import { sumRecipeNutrition } from '@recipe/utils/nutrition';
import { GET_RECIPE_NUTRITION } from '@recipe/graphql/queries/nutritionalInfo';
import { IngredientMeasureData, NutritionalInfoData } from '@recipe/utils/nutrition';

export function useNutritionalInfo(subsections: IngredientSubsectionView[], numServings: number) {
    // Collect unique ingredient IDs from Ingredient-type items
    const ingredientIds = [
        ...new Set(
            subsections
                .flatMap((s) => s.ingredients)
                .filter((i) => i.ingredient.__typename === 'Ingredient')
                .map((i) => i.ingredient._id)
        ),
    ];

    const { data, loading, refetch } = useQuery(GET_RECIPE_NUTRITION, {
        variables: { ingredientIds },
        skip: ingredientIds.length === 0,
    });

    // Build maps from ingredient _id → NutritionalInfoData (or null) and → measures
    const nutritionalInfoMap = new Map<string, NutritionalInfoData | null>();
    const measuresMap = new Map<string, IngredientMeasureData[]>();
    for (const id of ingredientIds) {
        const info = data?.nutritionalInfosByIngredientIds?.find(
            (n) => n != null && String(n.ingredient) === id
        );
        nutritionalInfoMap.set(id, info ?? null);
        measuresMap.set(
            id,
            (data?.ingredientMeasuresByIngredientIds ?? []).filter((m) => m.ingredient === id)
        );
    }
    const owners = new Map(
        (data?.ingredientByIds ?? []).map((ingredient) => [ingredient._id, ingredient.owner])
    );

    const result = sumRecipeNutrition(subsections, nutritionalInfoMap, measuresMap, numServings);

    return { ...result, owners, loading, refetch };
}
