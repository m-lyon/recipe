import { InMemoryCache } from '@apollo/client';

export const cache = new InMemoryCache({
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
    },
});
