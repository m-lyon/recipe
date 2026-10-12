import { Types } from 'mongoose';
import { GraphQLError } from 'graphql';

import { Unit } from '../models/Unit.js';
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

/** The fields that define a unit's size. Code owns them on a standard unit. */
const SIZE_FIELDS = ['dimension', 'perCanonical', 'system', 'hidden', 'standard'] as const;
type SizeField = (typeof SIZE_FIELDS)[number];
type UnitSizeFields = Partial<Record<SizeField, unknown>>;

function forbidden(message: string) {
    return new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });
}

/**
 * Only an admin creates a mass or volume unit: its size changes the nutrition of every
 * recipe that uses it. Anyone may create a count unit, which reaches grams only through a
 * weight recorded on the ingredient.
 */
export function validateUnitCreate(record: UnitSizeFields, isAdmin: boolean) {
    if (!isAdmin && record.dimension !== 'count') {
        throw forbidden(
            'Only an admin can create a mass or volume unit. Create a count unit, and record its weight on the ingredient.'
        );
    }
}

/**
 * Blocks a change to the size of a standard unit, whose size is defined in code, and stops
 * anyone but an admin turning a unit into a mass or volume unit. A record that repeats the
 * stored values is allowed, so a form may send every field.
 */
export async function validateUnitUpdate(
    unitId: Types.ObjectId,
    record: UnitSizeFields,
    isAdmin: boolean
) {
    const unit = await Unit.findById(unitId);
    if (!unit) return;
    const changed = SIZE_FIELDS.filter(
        (field) => field in record && String(record[field] ?? null) !== String(unit[field] ?? null)
    );
    if (changed.length === 0) return;
    if (unit.standard || changed.includes('standard')) {
        throw forbidden(
            `${unit.longSingular} is a standard unit. Its ${changed.join(', ')} cannot be changed.`
        );
    }
    const dimension = record.dimension ?? unit.dimension;
    if (!isAdmin && dimension !== 'count') {
        throw forbidden('Only an admin can change the size of a mass or volume unit.');
    }
}

export async function validateUnitNotStandard(unitId: Types.ObjectId) {
    const unit = await Unit.findById(unitId).select('standard longSingular');
    if (unit?.standard) {
        throw forbidden(`Cannot delete ${unit.longSingular}: it is a standard unit.`);
    }
}
