import { ambiguous, notFound } from './errors.js';
import type { ApiClient } from '../graphql/client.js';
import type { IngredientSummary, RecipeDetail } from './types.js';
import { GET_RECIPE_BY_IDENTIFIER } from '../graphql/operations.js';
import { GET_ALL_INGREDIENTS, GET_RECIPE_BY_ID } from '../graphql/operations.js';

export const MONGO_ID = /^[\da-f]{24}$/i;

export function isMongoId(value: string): boolean {
    return MONGO_ID.test(value);
}

export async function allIngredients(client: ApiClient): Promise<IngredientSummary[]> {
    const data = await client.request(GET_ALL_INGREDIENTS);
    return (data.ingredientManyAll ?? []).filter(Boolean) as unknown as IngredientSummary[];
}

/**
 * Resolves an ingredient by MongoID, or by an exact name or plural name.
 *
 * Names are stored lower-cased and are unique per owner, so an exact name can
 * still match more than one document when several users own one. That is an
 * ambiguity the caller must resolve, not one the CLI may guess at.
 */
export function matchIngredient(ingredients: IngredientSummary[], term: string): IngredientSummary {
    if (isMongoId(term)) {
        const byId = ingredients.find((ingredient) => ingredient._id === term);
        if (byId) return byId;
        throw notFound(`No ingredient with id ${term}.`);
    }
    const needle = term.trim().toLowerCase();
    const exact = ingredients.filter(
        (ingredient) =>
            ingredient.name.toLowerCase() === needle ||
            ingredient.pluralName.toLowerCase() === needle
    );
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) {
        throw ambiguous(
            `"${term}" matches ${exact.length} ingredients. Pass an id instead.`,
            exact.map((ingredient) => ({ _id: ingredient._id, name: ingredient.name }))
        );
    }
    const near = ingredients
        .filter((ingredient) => ingredient.name.toLowerCase().includes(needle))
        .slice(0, 10);
    const suggestion =
        near.length > 0
            ? ` Did you mean: ${near.map((ingredient) => ingredient.name).join(', ')}?`
            : '';
    throw notFound(`No ingredient named "${term}".${suggestion}`, {
        candidates: near.map((ingredient) => ({ _id: ingredient._id, name: ingredient.name })),
    });
}

export async function resolveIngredient(
    client: ApiClient,
    term: string
): Promise<{ ingredient: IngredientSummary; ingredients: IngredientSummary[] }> {
    const ingredients = await allIngredients(client);
    return { ingredient: matchIngredient(ingredients, term), ingredients };
}

/** Resolves a recipe by `titleIdentifier` or by MongoID. */
export async function resolveRecipe(client: ApiClient, identifier: string): Promise<RecipeDetail> {
    const recipe = isMongoId(identifier)
        ? (await client.request(GET_RECIPE_BY_ID, { id: identifier })).recipeById
        : (await client.request(GET_RECIPE_BY_IDENTIFIER, { titleIdentifier: identifier }))
              .recipeOne;
    if (!recipe) {
        throw notFound(`No recipe with identifier "${identifier}".`);
    }
    return recipe as unknown as RecipeDetail;
}
