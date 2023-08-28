import { Schema, Document, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Cuisine extends Document {
    value: string;
}

const cuisineSchema = new Schema<Cuisine>({
    value: { type: String, required: true, unique: true },
});

export const Cuisine = model<Cuisine>('Cuisine', cuisineSchema);

export const cuisineValidator = {
    validator: function (cuisines?: Types.ObjectId[]) {
        if (cuisines) {
            const uniqueCuisines = new Set(cuisines.map((tag) => tag.toString()));
            return uniqueCuisines.size === cuisines.length;
        }
        return true;
    },
    message: 'Duplicate cuisines are not allowed.',
};
export const CuisineTC = composeMongoose(Cuisine);
