import { Schema, Document, model } from 'mongoose';

export interface IImage extends Document {
    lowresPath?: string;
    fullresPath: string;
}

const imageSchema = new Schema<IImage>({
    lowresPath: { type: String },
    fullresPath: { type: String, required: true },
});

export const Image = model<IImage>('Image', imageSchema);
