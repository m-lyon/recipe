import { Schema, Document, Types, model } from 'mongoose';
import { tagValidator } from './Tag';

export interface Ingredient extends Document {
    name: string;
    tags?: Types.ObjectId[];
    prepMethods: Types.ObjectId[];
}

const ingredientSchema = new Schema<Ingredient>({
    name: { type: String, required: true, unique: true },
    tags: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
        validate: tagValidator,
    },
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
