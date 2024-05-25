import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { unitExists } from './validation.js';

export interface ConversionRule extends Document {
    baseUnitThreshold: number;
    unit: Types.ObjectId;
    baseUnit: Types.ObjectId;
    baseToUnitConversion: number;
}

export interface UnitConversion extends Document {
    baseUnit: Types.ObjectId;
    rules: Types.ObjectId[];
}

const conversionRuleSchema = new Schema<ConversionRule>({
    baseUnitThreshold: {
        type: Number,
        required: true,
        validate: {
            validator: (baseUnitThreshold: number) => baseUnitThreshold > 0,
            message: 'Threshold must be greater than 0.',
        },
    },
    unit: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Unit',
        validate: [
            unitExists(),
            {
                validator: async function (unit: Types.ObjectId) {
                    const count = await this.model('ConversionRule').countDocuments({
                        unit,
                        _id: { $ne: this._id }, // Exclude the current conversion rule
                    });
                    return count === 0;
                },
                message: 'Unit already has conversion rule.',
            },
        ],
    },
    baseUnit: { type: Schema.Types.ObjectId, required: true, ref: 'Unit', validate: unitExists() },
    baseToUnitConversion: {
        type: Number,
        required: true,
        validate: {
            validator: (baseToUnitConversion: number) => baseToUnitConversion >= 1,
            message: 'Base to unit conversion must be greater than 1.',
        },
    },
});

const unitConversionSchema = new Schema<UnitConversion>({
    baseUnit: { type: Schema.Types.ObjectId, required: true, ref: 'Unit', validate: unitExists() },
    rules: {
        type: [{ type: Schema.Types.ObjectId, ref: 'ConversionRule', required: true }],
        ref: 'ConversionRule',
        required: true,
        validate: [
            {
                validator: (rules: Types.ObjectId[]) => {
                    return rules.length > 0;
                },
                message: 'At least one rule is required.',
            },
            {
                validator: async function (rules: Types.ObjectId[]) {
                    const thresholdSet = await ConversionRule.distinct('baseUnitThreshold', {
                        _id: { $in: rules },
                    });
                    return thresholdSet.length === rules.length;
                },
                message: 'Duplicate thresholds are not allowed.',
            },
            {
                validator: async function (rules: Types.ObjectId[]) {
                    const baseUnitSet = await ConversionRule.distinct('baseUnit', {
                        _id: { $in: rules },
                    });
                    return baseUnitSet.length === 1;
                },
                message: 'All base units in rules must be the same.',
            },
        ],
    },
});
unitConversionSchema.pre('save', async function () {
    const rules = await ConversionRule.find({ _id: { $in: this.rules } });
    // sort in descending order
    rules.sort((a, b) => b.baseUnitThreshold - a.baseUnitThreshold);
    this.rules = rules.map((rule) => rule._id);
});
export const ConversionRule = model<ConversionRule>('ConversionRule', conversionRuleSchema);
export const ConversionRuleTC = composeMongoose(ConversionRule);
export const UnitConversion = model<UnitConversion>('UnitConversion', unitConversionSchema);
export const UnitConversionTC = composeMongoose(UnitConversion);
