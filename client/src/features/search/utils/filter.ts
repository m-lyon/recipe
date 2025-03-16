export interface Query {
    title?: string;
    tags?: string[];
    ingredients?: string[];
}
export function getSearchFilter(query: Query) {
    const { title, tags, ingredients } = query;
    const filter = {
        ...(title && { _operators: { title: { regex: `/${title}/i` } } }),
        ...(tags?.length && { tags }),
        ...(ingredients?.length && {
            ingredientSubsections: [
                { ingredients: ingredients.map((ingredient) => ({ ingredient })) },
            ],
        }),
    };
    return Object.keys(filter).length ? filter : undefined;
}
