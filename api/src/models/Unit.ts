import { Schema, Document, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Unit extends Document {
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
}

const unitSchema = new Schema<Unit>({
    shortSingular: { type: String, required: true, unique: true },
    shortPlural: { type: String, required: true, unique: true },
    longSingular: { type: String, required: true, unique: true },
    longPlural: { type: String, required: true, unique: true },
});

export const Unit = model<Unit>('Unit', unitSchema);
export const UnitTC = composeMongoose(Unit);
