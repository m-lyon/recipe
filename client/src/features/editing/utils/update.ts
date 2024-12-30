import { ApolloCache, InMemoryCache, Reference } from '@apollo/client';

import { RECIPE_FIELDS_SUBSET, RECIPE_INGR_FIELDS } from '@recipe/graphql/queries/recipe';

export function updateRecipeCache(
    cache: ApolloCache<InMemoryCache>,
    record: CompletedRecipeView,
    increment: boolean = false
) {
    cache.modify({
        fields: {
            recipeMany(existing = [], { storeFieldName, readField }) {
                let newRef;
                if (storeFieldName === 'recipeMany:{"filter":{"isIngredient":true}}') {
                    if (!record.isIngredient) {
                        return existing;
                    }
                    newRef = cache.writeFragment({
                        data: record,
                        fragment: RECIPE_INGR_FIELDS,
                        fragmentName: 'RecipeIngrFields',
                    });
                } else {
                    newRef = cache.writeFragment({
                        data: record,
                        fragment: RECIPE_FIELDS_SUBSET,
                        fragmentName: 'RecipeFieldsSubset',
                    });
                }
                if (existing.some((ref: Reference) => readField('_id', ref) === record._id)) {
                    return existing;
                }
                return [newRef, ...existing];
            },
            recipeCount: (count) => (increment ? count + 1 : count),
        },
    });
}
