import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ownerExists } from './validation.js';
import { uniqueInAdminsAndUser } from './validation.js';

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
        set: (value: string) => value.toLowerCase(),
        validate: uniqueInAdminsAndUser(
            'Ingredient',
            'name',
            'The ingredient name must be unique.'
        ),
    },
    pluralName: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: uniqueInAdminsAndUser(
            'Ingredient',
            'pluralName',
            'The plural ingredient name must be unique.'
        ),
    },
    density: { type: Number, required: false },
    isCountable: { type: Boolean, required: true },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User', validator: ownerExists() },
});

export const Ingredient = model<Ingredient>('Ingredient', ingredientSchema);
export const IngredientTC = composeMongoose(Ingredient);
export const IngredientCreateTC = composeMongoose(Ingredient, {
    removeFields: ['owner'],
    name: 'IngredientCreate',
});
