import { InMemoryCache } from '@apollo/client';

export const getCache = () =>
    new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    recipeMany: {
                        keyArgs: (args) => {
                            if (args?.filter) {
                                // Recipe ingredients query - cache separately
                                if (args.filter.isIngredient && !args.filter._operators) {
                                    return ['filter'];
                                }
                                // Linked recipes query
                                if (args.filter.ingredientSubsections) {
                                    return ['filter'];
                                }
                            }
                            return [];
                        },
                        merge(existing = [], incoming, { args, storage }) {
                            const { filter, limit, skip } = args || {};
                            // Filter is the same as before but skip is different, indicates pagination.
                            if (
                                JSON.stringify(filter) === JSON.stringify(storage.prev?.filter) &&
                                JSON.stringify(skip) !== JSON.stringify(storage.prev?.skip)
                            ) {
                                storage.prev = { filter, limit, skip };
                                return [...existing, ...incoming];
                            }
                            storage.prev = { filter, limit, skip };
                            return incoming;
                        },
                    },
                    recipeCount: { keyArgs: [] },
                },
            },
            Recipe: {
                fields: {
                    tags: {
                        merge(_existing, incoming) {
                            return incoming;
                        },
                    },
                    ingredientSubsections: {
                        merge(_existing, incoming) {
                            return incoming;
                        },
                    },
                    instructionSubsections: {
                        merge(_existing, incoming) {
                            return incoming;
                        },
                    },
                },
            },
        },
    });
