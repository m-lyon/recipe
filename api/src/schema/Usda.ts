import { GraphQLError } from 'graphql';
import { schemaComposer } from 'graphql-compose';

import { USDA_API_KEY } from '../constants.js';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USDA_REQUEST_TIMEOUT_MS = 10_000;
const USDA_MAX_PAGE_SIZE = 200;

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

function usdaFetch(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), USDA_REQUEST_TIMEOUT_MS);
    return fetch(url, {
        headers: { 'X-Api-Key': USDA_API_KEY },
        signal: controller.signal,
    }).finally(() => clearTimeout(timer));
}

export const UsdaQuery = {
    usdaSearch: schemaComposer.createResolver({
        name: 'usdaSearch',
        type: [UsdaFoodItemTC],
        args: { query: 'String!', pageSize: { type: 'Int', defaultValue: 20 } },
        resolve: async ({ args, context }) => {
            if (!context.getUser()) throw new GraphQLError('Not authenticated');
            if (typeof args.query !== 'string' || !args.query) {
                throw new GraphQLError('Invalid query argument', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const safePageSize = Math.min((args.pageSize as number) ?? 20, USDA_MAX_PAGE_SIZE);
            const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(args.query)}&pageSize=${safePageSize}`;
            const res = await usdaFetch(url);
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
            const url = `${USDA_BASE}/food/${args.fdcId}?format=abridged`;
            const res = await usdaFetch(url);
            if (!res.ok) {
                throw new GraphQLError(`USDA API error: ${res.status} ${res.statusText}`);
            }
            const json = (await res.json()) as Record<string, unknown>;
            if (!json['fdcId']) {
                throw new GraphQLError('Food item not found', { extensions: { code: 'NOT_FOUND' } });
            }
            return mapFoodItem(json);
        },
    }),
};
