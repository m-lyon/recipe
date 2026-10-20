import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface MacroNutrients {
    calories: number; // kcal
    protein: number; // g
    carbs: number; // g
    fat: number; // g
}

/** Where the values came from. Each source except `manual` carries its own record ID. */
export const NUTRITION_SOURCES = ['usda', 'openFoodFacts', 'manual'] as const;
export type NutritionSource = (typeof NUTRITION_SOURCES)[number];

export interface NutritionalInfo extends Document {
    ingredient: Types.ObjectId;
    source: NutritionSource;
    usdaFdcId?: number | null;
    offBarcode?: string | null;
    // The product or food name when linked, so a display needs no request to the source.
    sourceName?: string | null;
    perGram: MacroNutrients;
}

/** The source that a record's IDs imply, for a record saved without one. */
export function impliedSource(record: {
    usdaFdcId?: number | null;
    offBarcode?: string | null;
}): NutritionSource {
    if (record.usdaFdcId != null) return 'usda';
    if (record.offBarcode != null) return 'openFoodFacts';
    return 'manual';
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
        unique: true,
    },
    // Not required in the schema: a record saved without it, such as one from a client
    // that predates it, takes the source its IDs imply. See the validate hook.
    source: { type: String, enum: NUTRITION_SOURCES },
    usdaFdcId: { type: Number },
    offBarcode: { type: String, match: /^\d{8,14}$/ },
    sourceName: { type: String, trim: true },
    perGram: { type: macroNutrientsSchema, required: true },
});

nutritionalInfoSchema.pre('validate', function () {
    if (!this.source) {
        this.source = impliedSource(this);
    }
    // Each source carries its own ID and no other, so a record never names two sources.
    const has = { usda: this.usdaFdcId != null, openFoodFacts: this.offBarcode != null };
    if (this.source === 'usda' && !has.usda) {
        this.invalidate('usdaFdcId', 'A USDA source needs usdaFdcId');
    }
    if (this.source === 'openFoodFacts' && !has.openFoodFacts) {
        this.invalidate('offBarcode', 'An Open Food Facts source needs offBarcode');
    }
    if (this.source !== 'usda' && has.usda) {
        this.invalidate('usdaFdcId', `A ${this.source} source cannot carry usdaFdcId`);
    }
    if (this.source !== 'openFoodFacts' && has.openFoodFacts) {
        this.invalidate('offBarcode', `A ${this.source} source cannot carry offBarcode`);
    }
});

export const NutritionalInfo = model<NutritionalInfo>('NutritionalInfo', nutritionalInfoSchema);
export const NutritionalInfoTC = composeMongoose(NutritionalInfo);
export const NutritionalInfoCreateTC = composeMongoose(NutritionalInfo, {
    name: 'NutritionalInfoCreate',
});
