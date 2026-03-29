import { useQuery } from '@apollo/client';

import { NutritionalInfoData, sumRecipeNutrition } from '@recipe/utils/nutrition';
import { useUnitConversion } from '@recipe/features/servings';
import { GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS } from '@recipe/graphql/queries/nutritionalInfo';

export function useNutritionalInfo(subsections: IngredientSubsectionView[], numServings: number) {
    const { unitConversions } = useUnitConversion();

    // Collect unique ingredient IDs from Ingredient-type items
    const ingredientIds = [
        ...new Set(
            subsections
                .flatMap((s) => s.ingredients)
                .filter((i) => i.ingredient.__typename === 'Ingredient')
                .map((i) => i.ingredient._id)
        ),
    ];

    const { data, loading } = useQuery(GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS, {
        variables: { ingredientIds },
        skip: ingredientIds.length === 0,
    });

    // Build a map from ingredient _id → NutritionalInfoData (or null)
    const nutritionalInfoMap = new Map<string, NutritionalInfoData | null>();
    for (const id of ingredientIds) {
        const info = data?.nutritionalInfosByIngredientIds?.find(
            (n) => n != null && String(n.ingredient) === id
        );
        nutritionalInfoMap.set(id, info ?? null);
    }

    const result = sumRecipeNutrition(subsections, nutritionalInfoMap, unitConversions, numServings);

    return { ...result, loading };
}
