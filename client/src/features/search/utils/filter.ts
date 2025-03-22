import { FilterFindManyRecipeInput } from '@recipe/graphql/generated';

export interface Query {
    title?: string;
    tags?: string[];
    calculatedTags?: ReservedTags[];
    ingredients?: string[];
}

export function getSearchFilter(query: Query): FilterFindManyRecipeInput | undefined {
    const { title, tags, calculatedTags, ingredients } = query;
    const filters = [];
    if (title) {
        filters.push({ _operators: { title: { regex: `/${title}/i` } } });
    }
    if (tags?.length) {
        for (const tag of tags) {
            filters.push({ _operators: { tags: { in: [tag] } } });
        }
    }
    if (calculatedTags?.length) {
        for (const cTag of calculatedTags) {
            filters.push({ _operators: { calculatedTags: { in: [cTag] } } });
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
