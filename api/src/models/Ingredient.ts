import { Schema, Document, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Ingredient extends Document {
    name: string;
}

const ingredientSchema = new Schema<Ingredient>({
    name: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
});

export const Ingredient = model<Ingredient>('Ingredient', ingredientSchema);
export const IngredientTC = composeMongoose(Ingredient);
