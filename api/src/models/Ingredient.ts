import { Schema, Document, model, Types } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Ingredient extends Document {
    name: string;
    pluralName: string;
    density?: number;
    isCountable: boolean;
    owner: Types.ObjectId;
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
    density: { type: Number, required: false },
    isCountable: { type: Boolean, required: true },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
});

export const Ingredient = model<Ingredient>('Ingredient', ingredientSchema);
export const IngredientTC = composeMongoose(Ingredient);
