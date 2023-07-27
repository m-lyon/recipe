import { Schema, Document, model } from 'mongoose';

export interface PrepMethod extends Document {
    name: string;
}

const prepMethodSchema = new Schema<PrepMethod>({
    name: { type: String, required: true, unique: true },
});

export const PrepMethod = model<PrepMethod>('PrepMethod', prepMethodSchema);
