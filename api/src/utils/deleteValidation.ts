import { Types } from 'mongoose';
import { GraphQLError } from 'graphql';

import { Recipe } from '../models/Recipe.js';

export async function validateItemNotInRecipe(
    itemId: Types.ObjectId,
    itemType: 'unit' | 'size' | 'ingredient' | 'prepMethod'
) {
    type QueryType = {
        'ingredientSubsections.ingredients': { $elemMatch: Record<string, Types.ObjectId> };
    };

    let query: QueryType;

    switch (itemType) {
        case 'unit':
            query = {
                'ingredientSubsections.ingredients': {
                    $elemMatch: { unit: itemId },
                },
            };
            break;
        case 'size':
            query = {
                'ingredientSubsections.ingredients': {
                    $elemMatch: { size: itemId },
                },
            };
            break;
        case 'ingredient':
            query = {
                'ingredientSubsections.ingredients': {
                    $elemMatch: { ingredient: itemId },
                },
            };
            break;
        case 'prepMethod':
            query = {
                'ingredientSubsections.ingredients': {
                    $elemMatch: { prepMethod: itemId },
                },
            };
            break;
    }

    const recipesUsingItem = await Recipe.find(query).limit(1);

    if (recipesUsingItem.length > 0) {
        throw new GraphQLError(
            `Cannot delete ${itemType} as it is currently being used in existing recipes.`,
            {
                extensions: {
                    code: 'ITEM_IN_USE',
                    itemType,
                    itemId: itemId.toString(),
                },
            }
        );
    }
}
