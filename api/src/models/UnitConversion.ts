import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { unitExists } from './validation.js';

export interface ConversionRule extends Document {
    threshold: number;
    unit: Types.ObjectId;
    baseUnit: Types.ObjectId;
    baseConversion: number;
}

export interface UnitConversion extends Document {
    baseUnit: Types.ObjectId;
    rules: Types.ObjectId[];
}

const conversionRuleSchema = new Schema<ConversionRule>({
    threshold: {
        type: Number,
        required: true,
        validate: {
            validator: (threshold: number) => threshold > 0,
            message: 'Threshold must be greater than 0.',
        },
    },
    unit: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Unit',
        validate: unitExists(),
    },
    baseUnit: { type: Schema.Types.ObjectId, required: true, ref: 'Unit', validate: unitExists() },
    baseConversion: {
        type: Number,
        required: true,
        validate: {
            validator: (baseConversion: number) => baseConversion > 1,
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
                    console.log(rules);
                    return rules.length > 0;
                },
                message: 'At least one rule is required.',
            },
            {
                validator: async function (rules: Types.ObjectId[]) {
                    const ruleDocs = await ConversionRule.find({ _id: { $in: rules } });
                    return ruleDocs.every((rule) => rule.unit !== rule.baseUnit);
                },
                message: 'A rule cannot convert to the same unit.',
            },
            {
                validator: async function (rules: Types.ObjectId[]) {
                    const thresholdSet = await ConversionRule.distinct('threshold', {
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
            {
                validator: async function (rules: Types.ObjectId[]) {
                    const ruleDocs = await ConversionRule.find({ _id: { $in: rules } });
                    const count = await ConversionRule.countDocuments({
                        unit: { $in: ruleDocs.map((rule) => rule.unit) },
                        _id: { $ne: this._id }, // Exclude the current conversion rule
                    });
                    return count === 0;
                },
                message: 'Units can only appear in one conversion rule in the entire database.',
            },
        ],
    },
});
unitConversionSchema.pre('save', async function () {
    const rules = await ConversionRule.find({ _id: { $in: this.rules } });
    rules.sort((a, b) => b.threshold - a.threshold);
    this.rules = rules.map((rule) => rule._id);
});
export const ConversionRule = model<ConversionRule>('ConversionRule', conversionRuleSchema);
export const ConversionRuleTC = composeMongoose(ConversionRule);
export const UnitConversion = model<UnitConversion>('UnitConversion', unitConversionSchema);
export const UnitConversionTC = composeMongoose(UnitConversion);
