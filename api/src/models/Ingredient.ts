import { Schema, Document, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Ingredient extends Document {
    name: string;
    pluralName: string;
    density?: number;
    isCountable: boolean;
}

const ingredientSchema = new Schema<Ingredient>({
    name: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
    pluralName: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
    density: {
        type: Number,
        required: false,
    },
    isCountable: {
        type: Boolean,
        required: true,
    },
});

export const Ingredient = model<Ingredient>('Ingredient', ingredientSchema);
export const IngredientTC = composeMongoose(Ingredient);
