import { InMemoryCache } from '@apollo/client';

export const getCache = () =>
    new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    recipeMany: {
                        keyArgs: (args) => {
                            if (args?.filter) {
                                if (args.filter.isIngredient && !args.filter._operators) {
                                    return ['filter'];
                                }
                            }
                            return [];
                        },
                        merge(existing = [], incoming, { args, storage }) {
                            const currFilter = args?.filter;
                            if (JSON.stringify(currFilter) === JSON.stringify(storage.prevFilter)) {
                                storage.prevFilter = currFilter;
                                return [...existing, ...incoming];
                            }
                            storage.prevFilter = currFilter;
                            return incoming;
                        },
                    },
                },
            },
            Recipe: {
                fields: {
                    tags: {
                        merge(existing, incoming) {
                            return incoming;
                        },
                    },
                    ingredientSubsections: {
                        merge(existing, incoming) {
                            return incoming;
                        },
                    },
                    instructionSubsections: {
                        merge(existing, incoming) {
                            return incoming;
                        },
                    },
                },
            },
        },
    });
