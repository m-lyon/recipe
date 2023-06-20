import { Schema, Document, model } from 'mongoose';

export interface IPrepMethod extends Document {
    name: string;
}

const prepMethodSchema = new Schema<IPrepMethod>({
    name: { type: String, required: true, unique: true },
});

export const PrepMethod = model<IPrepMethod>('PrepMethod', prepMethodSchema);
