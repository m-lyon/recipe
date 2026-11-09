import { Flags } from '@oclif/core';

import { rejected } from './errors.js';
import type { IngredientSummary } from './types.js';

/** The only tags an ingredient may carry; the API rejects any other. */
export const INGREDIENT_TAGS = ['vegan', 'vegetarian'] as const;

export function tagFlag(description: string) {
    return Flags.string({ description, options: [...INGREDIENT_TAGS], multiple: true });
}

/** The API stores names lower-cased, so the CLI compares and shows them that way. */
export function normaliseName(value: string): string {
    const name = value.trim().toLowerCase();
    if (name === '') {
        throw rejected('A name must not be empty.');
    }
    return name;
}

/**
 * Exits 6 when another ingredient already has `name` as its name or plural name. The API
 * also refuses this, but checking first names the ingredient that holds the name.
 */
export function assertNameFree(
    ingredients: IngredientSummary[],
    name: string,
    flag: string,
    exceptId?: string
): void {
    const holder = ingredients.find(
        (ingredient) =>
            ingredient._id !== exceptId &&
            (ingredient.name.toLowerCase() === name || ingredient.pluralName.toLowerCase() === name)
    );
    if (holder) {
        throw rejected(`${flag} "${name}" is already used by the ingredient "${holder.name}".`, {
            existing: { _id: holder._id, name: holder.name, pluralName: holder.pluralName },
        });
    }
}

export function sortedTags(tags: readonly string[] | null | undefined): string[] {
    return [...new Set(tags ?? [])].sort();
}
