import { Schema, Document, Types, model } from 'mongoose';

export interface IImage extends Document {
    lowresPath?: string;
    fullresPath: string;
    recipe: Types.ObjectId;
}

const imageSchema = new Schema<IImage>({
    lowresPath: { type: String },
    fullresPath: { type: String, required: true },
    recipe: { type: Schema.Types.ObjectId, required: true, ref: 'Recipe' },
});

export const Image = model<IImage>('Image', imageSchema);
