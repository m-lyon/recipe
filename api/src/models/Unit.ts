import { Schema, Document, model } from 'mongoose';

export interface Unit extends Document {
    name: string;
}

const unitSchema = new Schema<Unit>({
    name: { type: String, required: true, unique: true },
});

export const Unit = model<Unit>('Unit', unitSchema);
