import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface MacroNutrients {
    calories: number; // kcal
    protein: number; // g
    carbs: number; // g
    fat: number; // g
}

export interface NutritionalInfo extends Document {
    ingredient: Types.ObjectId;
    usdaFdcId?: number;
    // Every quantity is resolved to grams first, through IngredientMeasure where needed.
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
        unique: true, // one document per ingredient
    },
    usdaFdcId: { type: Number },
    perGram: { type: macroNutrientsSchema, required: true },
});

export const NutritionalInfo = model<NutritionalInfo>('NutritionalInfo', nutritionalInfoSchema);
export const NutritionalInfoTC = composeMongoose(NutritionalInfo);
export const NutritionalInfoCreateTC = composeMongoose(NutritionalInfo, {
    name: 'NutritionalInfoCreate',
});
