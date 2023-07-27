import { Schema, Document, Types, model } from 'mongoose';

export interface Cuisine extends Document {
    name: string;
}

const cuisineSchema = new Schema<Cuisine>({
    name: { type: String, required: true, unique: true },
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
