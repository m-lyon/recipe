import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ownerExists, uniqueInAdminsAndUser } from '../middleware/validation.js';

export interface Unit extends Document {
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
    preferredNumberFormat: string;
    owner: Types.ObjectId;
    hasSpace: boolean;
}

const unitSchema = new Schema<Unit>({
    shortSingular: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: {
            validator: uniqueInAdminsAndUser('Unit', 'shortSingular'),
            message: 'The short plural unit name must be unique.',
        },
    },
    shortPlural: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: {
            validator: uniqueInAdminsAndUser('Unit', 'shortPlural'),
            message: 'The short plural unit name must be unique.',
        },
    },
    longSingular: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: {
            validator: uniqueInAdminsAndUser('Unit', 'longSingular'),
            message: 'The long singular unit name must be unique.',
        },
    },
    longPlural: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: {
            validator: uniqueInAdminsAndUser('Unit', 'longPlural'),
            message: 'The long plural unit name must be unique.',
        },
    },
    preferredNumberFormat: { type: String, required: true, enum: ['decimal', 'fraction'] },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User', validator: ownerExists() },
    hasSpace: { type: Boolean, required: true },
});

export const Unit = model<Unit>('Unit', unitSchema);
export const UnitTC = composeMongoose(Unit);
export const UnitCreateTC = composeMongoose(Unit, {
    removeFields: ['owner'],
    name: 'UnitCreate',
});
