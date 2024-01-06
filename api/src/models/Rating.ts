import { Schema, Document, model, Types } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';
import { Recipe } from './Recipe.js';
import { validateMongooseObjectIds } from './utils.js';

export interface Rating extends Document {
    value: number;
    recipe: Types.ObjectId;
}

const ratingSchema = new Schema<Rating>({
    value: {
        type: Number,
        required: true,
        validate: {
            validator: function (value: number) {
                return value >= 0 && value <= 10;
            },
            message: 'The rating must be between 0 and 10.',
        },
    },
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
});
ratingSchema.pre('save', async function (next) {
    await validateMongooseObjectIds.call(this, { recipe: Recipe }, next);
});

export const Rating = model<Rating>('Rating', ratingSchema);
export const RatingTC = composeMongoose(Rating);
