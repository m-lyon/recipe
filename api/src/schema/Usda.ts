import { GraphQLError } from 'graphql';
import { schemaComposer } from 'graphql-compose';

import { USDA_API_KEY } from '../constants.js';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

const UsdaFoodItemTC = schemaComposer.createObjectTC({
    name: 'UsdaFoodItem',
    fields: {
        fdcId: 'Int!',
        description: 'String!',
        brandOwner: 'String',
        caloriesPer100g: 'Float',
        proteinPer100g: 'Float',
        carbsPer100g: 'Float',
        fatPer100g: 'Float',
    },
});

function extractNutrient(foodNutrients: Array<Record<string, unknown>>, nutrientId: number): number | null {
    const entry = foodNutrients?.find(
        (n) => n['nutrientId'] === nutrientId || (n['nutrient'] as Record<string, unknown>)?.['id'] === nutrientId
    );
    if (!entry) return null;
    const value = entry['value'] ?? entry['amount'];
    return typeof value === 'number' ? value : null;
}

// USDA nutrient IDs: Energy=1008, Protein=1003, Carbs=1005, Fat=1004
function mapFoodItem(item: Record<string, unknown>) {
    const nutrients = (item['foodNutrients'] as Array<Record<string, unknown>>) ?? [];
    return {
        fdcId: item['fdcId'],
        description: item['description'],
        brandOwner: item['brandOwner'] ?? null,
        caloriesPer100g: extractNutrient(nutrients, 1008),
        proteinPer100g: extractNutrient(nutrients, 1003),
        carbsPer100g: extractNutrient(nutrients, 1005),
        fatPer100g: extractNutrient(nutrients, 1004),
    };
}

export const UsdaQuery = {
    usdaSearch: schemaComposer.createResolver({
        name: 'usdaSearch',
        type: [UsdaFoodItemTC],
        args: { query: 'String!', pageSize: { type: 'Int', defaultValue: 20 } },
        resolve: async ({ args, context }) => {
            if (!context.getUser()) throw new GraphQLError('Not authenticated');
            const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(args.query)}&pageSize=${args.pageSize}&api_key=${USDA_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new GraphQLError(`USDA API error: ${res.status} ${res.statusText}`);
            }
            const json = (await res.json()) as Record<string, unknown>;
            return ((json['foods'] as Array<Record<string, unknown>>) ?? []).map(mapFoodItem);
        },
    }),
    usdaFoodItem: schemaComposer.createResolver({
        name: 'usdaFoodItem',
        type: UsdaFoodItemTC,
        args: { fdcId: 'Int!' },
        resolve: async ({ args, context }) => {
            if (!context.getUser()) throw new GraphQLError('Not authenticated');
            const url = `${USDA_BASE}/food/${args.fdcId}?format=abridged&api_key=${USDA_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new GraphQLError(`USDA API error: ${res.status} ${res.statusText}`);
            }
            const json = (await res.json()) as Record<string, unknown>;
            return mapFoodItem(json);
        },
    }),
};
