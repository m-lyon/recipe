import { Schema, Document, model, Types } from 'mongoose';

export interface IRating extends Document {
    value: number;
    recipe: Types.ObjectId;
}

const ratingSchema = new Schema<IRating>({
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

export const Rating = model<IRating>('Rating', ratingSchema);
