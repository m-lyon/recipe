import { Schema, Document, Types, model } from 'mongoose';
import { Recipe } from './Recipe';
import { validateMongooseObjectIds } from './utils.js';

export interface Image extends Document {
    lowresPath?: string;
    fullresPath: string;
    recipe: Types.ObjectId;
}

const imageSchema = new Schema<Image>({
    lowresPath: { type: String },
    fullresPath: { type: String, required: true },
    recipe: { type: Schema.Types.ObjectId, required: true, ref: 'Recipe' },
});
imageSchema.pre('save', async function (next) {
    await validateMongooseObjectIds.call(this, { recipe: Recipe }, next);
});

export const Image = model<Image>('Image', imageSchema);
