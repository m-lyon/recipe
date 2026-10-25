import { composeMongoose } from 'graphql-compose-mongoose';
import { Document, HydratedDocument, Schema, Types, model } from 'mongoose';

import { PrepMethod } from './PrepMethod.js';

export interface MacroNutrients {
    calories: number; // kcal
    protein: number; // g
    carbs: number; // g
    fat: number; // g
}

export const NUTRITION_SOURCES = ['usda', 'openFoodFacts', 'manual'] as const;
export type NutritionSource = (typeof NUTRITION_SOURCES)[number];

export interface NutritionalInfo extends Document {
    ingredient: Types.ObjectId;
    prepMethod: Types.ObjectId | null;
    source: NutritionSource;
    usdaFdcId?: number | null;
    openFoodFactsBarcode?: string | null;
    sourceName?: string | null;
    perGram: MacroNutrients;
}

const macroNutrientsSchema = new Schema<MacroNutrients>(
    {
        calories: { type: Number, required: true, min: 0 },
        protein: { type: Number, required: true, min: 0 },
        carbs: { type: Number, required: true, min: 0 },
        fat: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const nutritionalInfoSchema = new Schema<NutritionalInfo>({
    ingredient: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Ingredient',
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
    source: { type: String, enum: NUTRITION_SOURCES, required: true },
    usdaFdcId: { type: Number },
    openFoodFactsBarcode: { type: String, match: /^\d{8,14}$/ },
    sourceName: { type: String, trim: true },
    perGram: { type: macroNutrientsSchema, required: true },
});

nutritionalInfoSchema.index({ ingredient: 1, prepMethod: 1 }, { unique: true });
nutritionalInfoSchema.path('ingredient').validate(async function (
    this: HydratedDocument<NutritionalInfo>
) {
    const count = await this.model('NutritionalInfo').countDocuments({
        _id: { $ne: this._id },
        ingredient: this.ingredient,
        prepMethod: this.prepMethod ?? null,
    });
    return count === 0;
}, 'Nutritional data for this ingredient and prep method already exists.');

nutritionalInfoSchema.pre('validate', function () {
    // Each source carries its own ID and no other, so a record never names two sources.
    const has = { usda: this.usdaFdcId != null, openFoodFacts: this.openFoodFactsBarcode != null };
    if (this.source === 'usda' && !has.usda) {
        this.invalidate('usdaFdcId', 'A USDA source needs usdaFdcId');
    }
    if (this.source === 'openFoodFacts' && !has.openFoodFacts) {
        this.invalidate(
            'openFoodFactsBarcode',
            'An Open Food Facts source needs openFoodFactsBarcode'
        );
    }
    if (this.source !== 'usda' && has.usda) {
        this.invalidate('usdaFdcId', `A ${this.source} source cannot carry usdaFdcId`);
    }
    if (this.source !== 'openFoodFacts' && has.openFoodFacts) {
        this.invalidate(
            'openFoodFactsBarcode',
            `A ${this.source} source cannot carry openFoodFactsBarcode`
        );
    }
});

export const NutritionalInfo = model<NutritionalInfo>('NutritionalInfo', nutritionalInfoSchema);
export const NutritionalInfoTC = composeMongoose(NutritionalInfo);
export const NutritionalInfoCreateTC = composeMongoose(NutritionalInfo, {
    name: 'NutritionalInfoCreate',
});
