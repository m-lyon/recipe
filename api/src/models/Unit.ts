import { Schema, Document, model, Types } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Unit extends Document {
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
    preferredNumberFormat: string;
    owner: Types.ObjectId;
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
    preferredNumberFormat: { type: String, required: true, enum: ['decimal', 'fraction'] },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
});

export const Unit = model<Unit>('Unit', unitSchema);
export const UnitTC = composeMongoose(Unit);
