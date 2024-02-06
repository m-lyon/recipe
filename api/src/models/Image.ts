import path from 'path';

import { Schema, Document, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';
import { IMAGE_DIR_URL } from '../constants.js';

export interface Image extends Document {
    lowresUrl?: string;
    origUrl: string;
    recipe: Types.ObjectId; // Required as auth middleware checks for this
    note?: string;
}

const imageSchema = new Schema<Image>({
    lowresUrl: { type: String },
    origUrl: { type: String, required: true },
    recipe: { type: Schema.Types.ObjectId, required: true, ref: 'Recipe' },
    note: { type: String },
});

export async function saveImageToDb(
    filepath: Promise<string>,
    recipe: Types.ObjectId,
    note?: string
) {
    const fname = path.basename(await filepath);
    const origUrl = new URL(fname, IMAGE_DIR_URL).href;
    const image = new Image({ origUrl, recipe, note });
    await image.save();
    return image;
}

export const Image = model<Image>('Image', imageSchema);
export const ImageTC = composeMongoose(Image);
