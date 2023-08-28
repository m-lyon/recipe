import { Schema, Document, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Ingredient extends Document {
    name: string;
    prepMethods: Types.ObjectId[];
}

const ingredientSchema = new Schema<Ingredient>({
    name: { type: String, required: true, unique: true },
    prepMethods: {
        type: [{ type: Schema.Types.ObjectId, ref: 'PrepMethod' }],
        validate: {
            validator: function (methods: Types.ObjectId[]) {
                const uniqueMethods = new Set(methods.map((method) => method.toString()));
                return uniqueMethods.size === methods.length;
            },
            message: 'Duplicate preparation methods are not allowed.',
        },
    },
});

export const Ingredient = model<Ingredient>('Ingredient', ingredientSchema);
export const IngredientTC = composeMongoose(Ingredient);
