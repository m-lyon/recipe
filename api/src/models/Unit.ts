import { Schema, Document, model } from 'mongoose';

export interface IUnit extends Document {
    name: string;
}

const unitSchema = new Schema<IUnit>({
    name: { type: String, required: true, unique: true },
});

export const Unit = model<IUnit>('Unit', unitSchema);
