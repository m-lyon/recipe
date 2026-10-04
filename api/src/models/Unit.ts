import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ownerExists, uniqueInAdminsAndUser } from './validation.js';

export const UnitDimensions = ['mass', 'volume', 'count'] as const;
export type UnitDimension = (typeof UnitDimensions)[number];
export const UnitSystems = ['metric', 'us'] as const;
export type UnitSystem = (typeof UnitSystems)[number];

/**
 * The unit each dimension's `perCanonical` is measured in: gram, millilitre and each. A
 * count unit is never converted to another count unit, so its factor is always 1.
 */
export interface Unit extends Document {
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
    preferredNumberFormat: string;
    owner: Types.ObjectId;
    hasSpace: boolean;
    unique: boolean;
    dimension: UnitDimension;
    perCanonical: number;
    system: UnitSystem | null;
    hidden: boolean;
}

const unitSchema = new Schema<Unit>({
    shortSingular: {
        type: String,
        required: true,
        set: (value: string) => value.toLowerCase(),
        validate: uniqueInAdminsAndUser(
            'Unit',
            'shortSingular',
            'The short singular unit name must be unique.'
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
    unique: { type: Boolean, required: true },
    dimension: { type: String, required: true, enum: UnitDimensions },
    perCanonical: {
        type: Number,
        required: true,
        validate: [
            {
                validator: (value: number) => value > 0,
                message: 'The size of a unit must be greater than 0.',
            },
            {
                validator: function (this: Unit, value: number) {
                    return this.dimension !== 'count' || value === 1;
                },
                message: 'A count unit must have a size of 1.',
            },
        ],
    },
    system: {
        type: String,
        // `null` is listed because Mongoose's enum validator only exempts `undefined`.
        enum: [...UnitSystems, null],
        default: null,
        validate: {
            validator: function (this: Unit, value: UnitSystem | null) {
                if (this.dimension === 'count') {
                    return value == null;
                }
                return value != null;
            },
            message: 'A mass or volume unit needs a system, and a count unit must not have one.',
        },
    },
    hidden: { type: Boolean, default: false },
});

export const Unit = model<Unit>('Unit', unitSchema);
export const UnitTC = composeMongoose(Unit);
export const UnitCreateTC = composeMongoose(Unit, {
    removeFields: ['owner'],
    name: 'UnitCreate',
});
