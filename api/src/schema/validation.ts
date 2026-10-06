import { Types } from 'mongoose';
import { GraphQLError } from 'graphql';

import { Recipe } from '../models/Recipe.js';
import { DisplayLadder } from '../models/DisplayLadder.js';
import { IngredientMeasure } from '../models/IngredientMeasure.js';

export async function validateItemNotInRecipe(
    itemId: Types.ObjectId,
    itemType: 'unit' | 'size' | 'ingredient' | 'prepMethod' | 'recipe',
    errorNoun?: string
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
        case 'recipe':
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
        const otherStr = itemType == 'recipe' ? 'other ' : '';
        const errorNounStr = errorNoun ? `${errorNoun}` : 'delete';

        throw new GraphQLError(
            `Cannot ${errorNounStr} ${itemType} as it is currently being used in ${otherStr}existing recipes.`,
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

function itemInUseError(message: string, itemType: string, itemId: Types.ObjectId) {
    return new GraphQLError(message, {
        extensions: { code: 'ITEM_IN_USE', itemType, itemId: itemId.toString() },
    });
}

/** Blocks deleting a unit, size or prep method that an ingredient measure is keyed on. */
export async function validateItemNotInMeasure(
    itemId: Types.ObjectId,
    itemType: 'unit' | 'size' | 'prepMethod'
) {
    const inUse = await IngredientMeasure.exists({ [itemType]: itemId });
    if (inUse) {
        throw itemInUseError(
            `Cannot delete ${itemType} as it is currently being used in ingredient measures.`,
            itemType,
            itemId
        );
    }
}

export async function validateUnitNotInLadder(unitId: Types.ObjectId) {
    const inUse = await DisplayLadder.exists({ 'steps.unit': unitId });
    if (inUse) {
        throw itemInUseError(
            'Cannot delete unit as it is currently being used in display ladders.',
            'unit',
            unitId
        );
    }
}
