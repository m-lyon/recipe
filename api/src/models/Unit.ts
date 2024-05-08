import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ownerExists, uniqueInAdminsAndUser } from './validation.js';

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
        validate: uniqueInAdminsAndUser(
            'Unit',
            'shortSingular',
            'The short plural unit name must be unique.'
        ),
    },
    shortPlural: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: uniqueInAdminsAndUser(
            'Unit',
            'shortPlural',
            'The short plural unit name must be unique.'
        ),
    },
    longSingular: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: uniqueInAdminsAndUser(
            'Unit',
            'longSingular',
            'The long singular unit name must be unique.'
        ),
    },
    longPlural: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: uniqueInAdminsAndUser(
            'Unit',
            'longPlural',
            'The long plural unit name must be unique.'
        ),
    },
    preferredNumberFormat: { type: String, required: true, enum: ['decimal', 'fraction'] },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User', validate: ownerExists() },
    hasSpace: { type: Boolean, required: true },
});

export const Unit = model<Unit>('Unit', unitSchema);
export const UnitTC = composeMongoose(Unit);
export const UnitCreateTC = composeMongoose(Unit, {
    removeFields: ['owner'],
    name: 'UnitCreate',
});
