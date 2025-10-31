import { Types } from 'mongoose';
import { GraphQLError } from 'graphql';

import { Recipe } from '../models/Recipe.js';
import { ConversionRule, UnitConversion } from '../models/UnitConversion.js';

export async function validateItemNotInRecipe(
    itemId: Types.ObjectId,
    itemType: 'unit' | 'size' | 'ingredient' | 'prepMethod' | 'recipe'
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
        throw new GraphQLError(
            `Cannot delete ${itemType} as it is currently being used in ${otherStr}existing recipes.`,
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

export async function validateUnitNotInConversion(unitId: Types.ObjectId) {
    // Check if unit is used as a base unit in any UnitConversion
    const conversionsUsingUnitAsBase = await UnitConversion.find({
        baseUnit: unitId,
    }).limit(1);

    if (conversionsUsingUnitAsBase.length > 0) {
        throw new GraphQLError(
            `Cannot delete unit as it is currently being used in existing conversions.`,
            {
                extensions: {
                    code: 'ITEM_IN_USE',
                    itemType: 'unit',
                    itemId: unitId.toString(),
                },
            }
        );
    }

    // Check if unit is used in any ConversionRule (either as unit or baseUnit)
    const rulesUsingUnit = await ConversionRule.find({
        $or: [{ unit: unitId }, { baseUnit: unitId }],
    }).limit(1);

    if (rulesUsingUnit.length > 0) {
        throw new GraphQLError(
            `Cannot delete unit as it is currently being used in existing conversions.`,
            {
                extensions: {
                    code: 'ITEM_IN_USE',
                    itemType: 'unit',
                    itemId: unitId.toString(),
                },
            }
        );
    }
}
