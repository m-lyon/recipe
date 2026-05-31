import { ApolloCache, NormalizedCacheObject, Reference } from '@apollo/client';

import { ReservedTags } from '@recipe/graphql/enums';
import { formatCalculatedTag } from '@recipe/features/tags';
import { RECIPE_INGR_FIELDS } from '@recipe/graphql/queries/recipe';
import { RECIPE_FIELDS_SUBSET } from '@recipe/graphql/queries/recipe';

export function updateRecipeCache(
    cache: ApolloCache<NormalizedCacheObject>,
    record: CompletedRecipeView,
    increment: boolean = false
) {
    const shouldIncrementCount = increment && !record.originalRecipe;

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
                    // Don't add vegan copies (recipes with originalRecipe set) to the
                    // home-page recipeMany array — they should be hidden from the home page.
                    if (record.originalRecipe) {
                        return existing;
                    }
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
            recipeCount: (count) => (shouldIncrementCount ? count + 1 : count),
        },
    });
}

export function removeRecipeFromLists(
    cache: ApolloCache<NormalizedCacheObject>,
    recordId: string,
    decrement: boolean = false
) {
    cache.modify({
        fields: {
            recipeMany(existing: readonly Reference[] = [], { readField }) {
                return existing.filter((ref) => readField('_id', ref) !== recordId);
            },
            recipeCount(count = 0) {
                return decrement ? Math.max(0, count - 1) : count;
            },
        },
    });
}

export function archiveRecipeCache(
    cache: ApolloCache<NormalizedCacheObject>,
    recipe: Pick<CompletedRecipeView, '_id' | 'veganVersion'>
) {
    removeRecipeFromLists(cache, recipe._id, true);

    if (recipe.veganVersion?._id) {
        removeRecipeFromLists(cache, recipe.veganVersion._id);
        cache.modify({
            id: cache.identify({ __typename: 'Recipe', _id: recipe.veganVersion._id }),
            fields: {
                archived() {
                    return true;
                },
            },
        });
    }

    cache.modify({
        id: cache.identify({ __typename: 'Recipe', _id: recipe._id }),
        fields: {
            archived() {
                return true;
            },
        },
    });
}

export function deleteVeganRecipeCache(
    cache: ApolloCache<NormalizedCacheObject>,
    recipe: Pick<CompletedRecipeView, '_id' | 'originalRecipe' | 'titleIdentifier'>
) {
    const originalId = recipe.originalRecipe?._id;
    if (originalId) {
        cache.modify({
            id: cache.identify({ __typename: 'Recipe', _id: originalId }),
            fields: {
                veganVersion() {
                    return null;
                },
                calculatedTags(existing: Reference | string[] = []) {
                    if (!Array.isArray(existing)) {
                        return existing;
                    }
                    return existing.filter(
                        (tag) => tag !== formatCalculatedTag(ReservedTags.VeganVersionAvailable)
                    );
                },
            },
        });
    }

    cache.evict({ id: cache.identify({ __typename: 'Recipe', _id: recipe._id }) });
}
