import { Schema, Document, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Unit extends Document {
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
}

const unitSchema = new Schema<Unit>({
    shortSingular: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
    shortPlural: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
    longSingular: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
    longPlural: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
});

export const Unit = model<Unit>('Unit', unitSchema);
export const UnitTC = composeMongoose(Unit);
