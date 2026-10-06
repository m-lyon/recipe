import { composeMongoose } from 'graphql-compose-mongoose';
import { Document, HydratedDocument, Schema, Types, model } from 'mongoose';

import type { UnitSystem } from './Unit.js';
import { Unit, UnitSystems } from './Unit.js';
import { ownerExists, uniqueInAdminsAndUser } from './validation.js';

export const LadderDimensions = ['mass', 'volume'] as const;
export type LadderDimension = (typeof LadderDimensions)[number];
export const LadderScopes = ['global', 'user'] as const;
export type LadderScope = (typeof LadderScopes)[number];

export interface DisplayLadderStep {
    unit: Types.ObjectId;
    /** The smallest quantity, in canonical units, that is shown in this step's unit. */
    minCanonical: number;
}

/**
 * Display policy for one dimension within one system: which unit a quantity is shown in.
 * Steps are kept in descending order of `minCanonical`, and the first step whose threshold
 * is at or below the quantity wins.
 */
export interface DisplayLadder extends Document {
    name: string;
    dimension: LadderDimension;
    system: UnitSystem;
    scope: LadderScope;
    owner: Types.ObjectId;
    steps: DisplayLadderStep[];
}

const displayLadderStepSchema = new Schema<DisplayLadderStep>(
    {
        unit: { type: Schema.Types.ObjectId, required: true, ref: 'Unit' },
        minCanonical: {
            type: Number,
            required: true,
            validate: {
                validator: (value: number) => value >= 0,
                message: 'A step threshold cannot be negative.',
            },
        },
    },
    { _id: false }
);

const displayLadderSchema = new Schema<DisplayLadder>({
    name: {
        type: String,
        required: true,
        validate: uniqueInAdminsAndUser<DisplayLadder>(
            'DisplayLadder',
            'name',
            'The ladder name must be unique.'
        ),
    },
    dimension: { type: String, required: true, enum: LadderDimensions },
    system: { type: String, required: true, enum: UnitSystems },
    scope: { type: String, required: true, enum: LadderScopes },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User', validate: ownerExists() },
    steps: {
        type: [displayLadderStepSchema],
        required: true,
        validate: [
            {
                validator: (steps: DisplayLadderStep[]) => steps.length > 0,
                message: 'At least one step is required.',
            },
            {
                validator: (steps: DisplayLadderStep[]) =>
                    new Set(steps.map((step) => String(step.unit))).size === steps.length,
                message: 'A unit can appear only once in a ladder.',
            },
            {
                validator: async function (
                    this: HydratedDocument<DisplayLadder>,
                    steps: DisplayLadderStep[]
                ) {
                    const units = await Unit.find({ _id: { $in: steps.map((s) => s.unit) } });
                    if (units.length !== steps.length) {
                        return false;
                    }
                    return units.every(
                        (unit) => unit.dimension === this.dimension && unit.system === this.system
                    );
                },
                message: 'Every step unit must exist and match the ladder dimension and system.',
            },
        ],
    },
});
displayLadderSchema.pre('save', function () {
    this.steps.sort((a, b) => b.minCanonical - a.minCanonical);
});

export const DisplayLadder = model<DisplayLadder>('DisplayLadder', displayLadderSchema);
export const DisplayLadderTC = composeMongoose(DisplayLadder);
export const DisplayLadderCreateTC = composeMongoose(DisplayLadder, {
    removeFields: ['owner'],
    name: 'DisplayLadderCreate',
});
