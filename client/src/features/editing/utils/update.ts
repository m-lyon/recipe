import { ApolloCache, InMemoryCache, Reference } from '@apollo/client';

import { ReservedTags } from '@recipe/graphql/enums';
import { RECIPE_INGR_FIELDS } from '@recipe/graphql/queries/recipe';
import { GET_RECIPE, RECIPE_FIELDS_SUBSET } from '@recipe/graphql/queries/recipe';
import { GetRecipeQuery, GetRecipeQueryVariables } from '@recipe/graphql/generated';

export function updateRecipeCache(
    cache: ApolloCache<InMemoryCache>,
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
    cache: ApolloCache<InMemoryCache>,
    recordId: string,
    decrement: boolean = false
) {
    cache.modify({
        fields: {
            recipeMany(existing: Reference[] = [], { readField }) {
                return existing.filter((ref) => readField('_id', ref) !== recordId);
            },
            recipeCount(count = 0) {
                return decrement ? Math.max(0, count - 1) : count;
            },
        },
    });
}

export function archiveRecipeCache(
    cache: ApolloCache<InMemoryCache>,
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
    cache: ApolloCache<InMemoryCache>,
    recipe: Pick<CompletedRecipeView, '_id' | 'originalRecipe' | 'titleIdentifier'>
) {
    removeRecipeFromLists(cache, recipe._id);

    cache.writeQuery<GetRecipeQuery, GetRecipeQueryVariables>({
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: recipe.titleIdentifier } },
        data: {
            __typename: 'Query',
            recipeOne: null,
        },
    });

    cache.evict({ id: cache.identify({ __typename: 'Recipe', _id: recipe._id }) });
    cache.gc();

    const originalId = recipe.originalRecipe?._id;
    if (!originalId) {
        return;
    }

    cache.modify({
        id: cache.identify({ __typename: 'Recipe', _id: originalId }),
        fields: {
            veganVersion() {
                return null;
            },
            calculatedTags(existing: string[] = []) {
                return existing.filter(
                    (tag) => tag !== ReservedTags.VeganVersionAvailable
                );
            },
        },
    });
}
