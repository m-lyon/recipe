import { Schema, Document, Types, model } from 'mongoose';

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

export const Image = model<Image>('Image', imageSchema);
