import { Schema, Document, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Unit extends Document {
    shortValue: string;
    longValue: string;
}

const unitSchema = new Schema<Unit>({
    shortValue: { type: String, required: true, unique: true },
    longValue: { type: String, required: true, unique: true },
});

export const Unit = model<Unit>('Unit', unitSchema);
export const UnitTC = composeMongoose(Unit);
