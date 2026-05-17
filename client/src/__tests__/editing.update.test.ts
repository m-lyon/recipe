import { describe, expect, it } from 'vitest';

import { getCache } from '@recipe/utils/cache';
import { ReservedTags } from '@recipe/graphql/enums';
import { updateRecipeCache } from '@recipe/features/editing';
import { GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockRecipeVeganCopy } from '@recipe/graphql/queries/__mocks__/recipe';
import { archiveRecipeCache, deleteVeganRecipeCache } from '@recipe/features/editing';
import { mockRecipeWithVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeFour, mockRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeThree, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';

describe('editing cache helpers', () => {
    it('archiveRecipeCache removes the original from home-page lists, decrements count, and archives linked vegan recipe', () => {
        const cache = getCache();

        cache.writeQuery({
            query: GET_RECIPES,
            variables: {
                offset: 0,
                limit: 5,
                filter: { archived: false, originalRecipe: null },
                countFilter: { archived: false, originalRecipe: null },
            },
            data: {
                __typename: 'Query',
                recipeMany: [mockRecipeWithVeganVersion, mockRecipeThree, mockRecipeFour],
                recipeCount: 3,
            },
        });

        cache.writeQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            data: {
                __typename: 'Query',
                recipeOne: mockRecipeWithVeganVersion,
            },
        });

        cache.writeQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one-vegan' } },
            data: {
                __typename: 'Query',
                recipeOne: {
                    ...mockRecipeVeganCopy,
                    calculatedTags: [ReservedTags.Vegan],
                },
            },
        });

        archiveRecipeCache(cache, mockRecipeWithVeganVersion);

        const homeData = cache.readQuery({
            query: GET_RECIPES,
            variables: {
                offset: 0,
                limit: 5,
                filter: { archived: false, originalRecipe: null },
                countFilter: { archived: false, originalRecipe: null },
            },
        });
        const originalData = cache.readQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
        });
        const veganData = cache.readQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one-vegan' } },
        });

        expect(homeData?.recipeMany.map((recipe) => recipe._id)).toEqual([
            mockRecipeThree._id,
            mockRecipeFour._id,
        ]);
        expect(homeData?.recipeCount).toBe(2);
        expect(originalData?.recipeOne?.archived).toBe(true);
        expect(veganData?.recipeOne?.archived).toBe(true);
    });

    it('deleteVeganRecipeCache removes linked vegan state from the original and clears future vegan-copy reads', () => {
        const cache = getCache();
        const originalWithLinkedTag = {
            ...mockRecipeOne,
            calculatedTags: [
                ReservedTags.Vegan,
                ReservedTags.Vegetarian,
                ReservedTags.VeganVersionAvailable,
            ],
            veganVersion: {
                __typename: 'Recipe' as const,
                _id: mockRecipeTwo._id,
                title: mockRecipeVeganCopy.title,
                titleIdentifier: mockRecipeVeganCopy.titleIdentifier,
            },
        };

        cache.writeQuery({
            query: GET_RECIPES,
            variables: {
                offset: 0,
                limit: 5,
                filter: { archived: false, originalRecipe: null },
                countFilter: { archived: false, originalRecipe: null },
            },
            data: {
                __typename: 'Query',
                recipeMany: [originalWithLinkedTag, mockRecipeThree, mockRecipeFour],
                recipeCount: 3,
            },
        });

        cache.writeQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            data: {
                __typename: 'Query',
                recipeOne: originalWithLinkedTag,
            },
        });

        cache.writeQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one-vegan' } },
            data: {
                __typename: 'Query',
                recipeOne: mockRecipeVeganCopy,
            },
        });

        deleteVeganRecipeCache(cache, mockRecipeVeganCopy);

        const homeData = cache.readQuery({
            query: GET_RECIPES,
            variables: {
                offset: 0,
                limit: 5,
                filter: { archived: false, originalRecipe: null },
                countFilter: { archived: false, originalRecipe: null },
            },
        });
        const originalData = cache.readQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
        });
        const veganData = cache.readQuery({
            query: GET_RECIPE,
            variables: { filter: { titleIdentifier: 'mock-recipe-one-vegan' } },
        });
        expect(homeData?.recipeCount).toBe(3);
        expect(homeData?.recipeMany.map((recipe) => recipe._id)).toEqual([
            mockRecipeOne._id,
            mockRecipeThree._id,
            mockRecipeFour._id,
        ]);
        expect(originalData?.recipeOne?.veganVersion).toBeNull();
        expect(originalData?.recipeOne?.calculatedTags).not.toContain(
            ReservedTags.VeganVersionAvailable
        );
        expect(veganData?.recipeOne).toBeNull();
        expect(cache.extract()[`Recipe:${mockRecipeVeganCopy._id}`]).toBeUndefined();
    });

    it('updateRecipeCache keeps home-page recipeCount unchanged for vegan copies', () => {
        const cache = getCache();

        cache.writeQuery({
            query: GET_RECIPES,
            variables: {
                offset: 0,
                limit: 5,
                filter: { archived: false, originalRecipe: null },
                countFilter: { archived: false, originalRecipe: null },
            },
            data: {
                __typename: 'Query',
                recipeMany: [mockRecipeOne, mockRecipeThree, mockRecipeFour],
                recipeCount: 3,
            },
        });

        updateRecipeCache(cache, mockRecipeVeganCopy, true);

        const homeData = cache.readQuery({
            query: GET_RECIPES,
            variables: {
                offset: 0,
                limit: 5,
                filter: { archived: false, originalRecipe: null },
                countFilter: { archived: false, originalRecipe: null },
            },
        });

        expect(homeData?.recipeMany.map((recipe) => recipe._id)).toEqual([
            mockRecipeOne._id,
            mockRecipeThree._id,
            mockRecipeFour._id,
        ]);
        expect(homeData?.recipeCount).toBe(3);
    });
});
