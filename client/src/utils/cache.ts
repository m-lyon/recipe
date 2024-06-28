import { InMemoryCache } from '@apollo/client';

export const getCache = () =>
    new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    recipeMany: {
                        keyArgs: ['filter'],
                        merge(existing = [], incoming) {
                            const resulting = [...existing, ...incoming];
                            return resulting;
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
                },
            },
        },
    });
