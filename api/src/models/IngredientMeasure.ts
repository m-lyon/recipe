import { composeMongoose } from 'graphql-compose-mongoose';
import { Document, HydratedDocument, Schema, Types, model } from 'mongoose';

import { Size } from './Size.js';
import { unitExists } from './validation.js';
import { Ingredient } from './Ingredient.js';
import { PrepMethod } from './PrepMethod.js';

/**
 * The weight of one of `unit` of an ingredient, optionally narrowed by size and prep method.
 * A volume row is a density, and a count row is an item weight.
 */
export interface IngredientMeasure extends Document {
    ingredient: Types.ObjectId;
    unit: Types.ObjectId;
    size: Types.ObjectId | null;
    prepMethod: Types.ObjectId | null;
    grams: number;
}

const ingredientMeasureSchema = new Schema<IngredientMeasure>({
    ingredient: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Ingredient',
        validate: {
            validator: async (ingredient: Types.ObjectId) =>
                (await Ingredient.exists({ _id: ingredient })) != null,
            message: 'Ingredient does not exist.',
        },
    },
    unit: { type: Schema.Types.ObjectId, required: true, ref: 'Unit', validate: unitExists() },
    size: {
        type: Schema.Types.ObjectId,
        ref: 'Size',
        // Stored as an explicit null so the unique index treats "no size" as one value.
        default: null,
        validate: {
            validator: async (size: Types.ObjectId | null) =>
                size == null || (await Size.exists({ _id: size })) != null,
            message: 'Size does not exist.',
        },
    },
    prepMethod: {
        type: Schema.Types.ObjectId,
        ref: 'PrepMethod',
        default: null,
        validate: {
            validator: async (prepMethod: Types.ObjectId | null) =>
                prepMethod == null || (await PrepMethod.exists({ _id: prepMethod })) != null,
            message: 'Prep method does not exist.',
        },
    },
    grams: {
        type: Number,
        required: true,
        validate: {
            validator: (grams: number) => grams > 0,
            message: 'The weight must be greater than 0.',
        },
    },
});
ingredientMeasureSchema.index({ ingredient: 1, unit: 1, size: 1, prepMethod: 1 }, { unique: true });
ingredientMeasureSchema.path('unit').validate(async function (
    this: HydratedDocument<IngredientMeasure>
) {
    const count = await this.model('IngredientMeasure').countDocuments({
        _id: { $ne: this._id },
        ingredient: this.ingredient,
        unit: this.unit,
        size: this.size ?? null,
        prepMethod: this.prepMethod ?? null,
    });
    return count === 0;
}, 'A measure for this unit, size and prep method already exists.');

export const IngredientMeasure = model<IngredientMeasure>(
    'IngredientMeasure',
    ingredientMeasureSchema
);
export const IngredientMeasureTC = composeMongoose(IngredientMeasure);
