import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

interface MacroNutrients {
    calories: number; // kcal
    protein: number; // g
    carbs: number; // g
    fat: number; // g
}

export interface NutritionalInfo extends Document {
    ingredient: Types.ObjectId;
    usdaFdcId?: number;
    perGram?: MacroNutrients; // mass-based or volume-based (via density)
    perUnit?: MacroNutrients; // countable, e.g. 1 egg
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
        unique: true, // one document per ingredient
    },
    usdaFdcId: { type: Number },
    perGram: { type: macroNutrientsSchema, required: false },
    perUnit: { type: macroNutrientsSchema, required: false },
});

// At least one of perGram or perUnit must be present
nutritionalInfoSchema.pre('validate', function () {
    if (!this.perGram && !this.perUnit) {
        throw new Error('NutritionalInfo must have at least one of perGram or perUnit.');
    }
});

export const NutritionalInfo = model<NutritionalInfo>('NutritionalInfo', nutritionalInfoSchema);
export const NutritionalInfoTC = composeMongoose(NutritionalInfo);
export const NutritionalInfoCreateTC = composeMongoose(NutritionalInfo, {
    removeFields: [],
    name: 'NutritionalInfoCreate',
});
