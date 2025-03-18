import { FilterFindManyRecipeInput } from '@recipe/graphql/generated';

export interface Query {
    title?: string;
    tags?: string[];
    ingredients?: string[];
}

export function getSearchFilter(query: Query): FilterFindManyRecipeInput | undefined {
    const { title, tags, ingredients } = query;
    const filters = [];
    if (title) {
        filters.push({ _operators: { title: { regex: `/${title}/i` } } });
    }
    if (tags?.length) {
        for (const tag of tags) {
            filters.push({ _operators: { tags: { in: [tag] } } });
        }
    }
    if (ingredients?.length) {
        for (const ingredient of ingredients) {
            filters.push({
                _operators: {
                    ingredientSubsections: { ingredients: { ingredient: { in: [ingredient] } } },
                },
            });
        }
    }
    return filters.length ? { AND: filters } : undefined;
}
