import { UnitTC } from '../models/Unit.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { ConversionRule, ConversionRuleTC } from '../models/UnitConversion.js';
import { UnitConversion, UnitConversionTC } from '../models/UnitConversion.js';

ConversionRuleTC.addResolver({
    name: 'createOne',
    description: 'Create a new conversion rule',
    type: ConversionRuleTC.mongooseResolvers.createOne().getType(),
    args: ConversionRuleTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(ConversionRule, ConversionRuleTC),
});

ConversionRuleTC.addResolver({
    name: 'updateById',
    description: 'Update a conversion rule by its ID',
    type: ConversionRuleTC.mongooseResolvers.updateById().getType(),
    args: ConversionRuleTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(ConversionRule, ConversionRuleTC),
});

ConversionRuleTC.addRelation('unit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.unit,
    },
    projection: { unit: true },
});
ConversionRuleTC.addRelation('baseUnit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.baseUnit,
    },
    projection: { baseUnit: true },
});

export const ConversionRuleQuery = {
    conversionRuleById: ConversionRuleTC.mongooseResolvers
        .findById()
        .setDescription('Retrieve a conversion rule by its ID'),
    conversionRuleByIds: ConversionRuleTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple conversion rules by their IDs'),
    conversionRuleOne: ConversionRuleTC.mongooseResolvers
        .findOne()
        .setDescription('Retrieve a single conversion rule'),
    conversionRuleMany: ConversionRuleTC.mongooseResolvers
        .findMany()
        .setDescription('Retrieve multiple conversion rules'),
};

export const ConversionRuleMutation = {
    conversionRuleCreateOne: ConversionRuleTC.getResolver('createOne'),
    conversionRuleUpdateById: ConversionRuleTC.getResolver('updateById'),
    conversionRuleRemoveById: ConversionRuleTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a conversion rule by its ID'),
    conversionRuleRemoveOne: ConversionRuleTC.mongooseResolvers
        .removeOne()
        .setDescription('Remove a single conversion rule'),
};

UnitConversionTC.addResolver({
    name: 'createOne',
    description: 'Create a new unit conversion',
    type: UnitConversionTC.mongooseResolvers.createOne().getType(),
    args: UnitConversionTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(UnitConversion, UnitConversionTC),
});

UnitConversionTC.addResolver({
    name: 'updateById',
    description: 'Update a unit conversion',
    type: UnitConversionTC.mongooseResolvers.updateById().getType(),
    args: UnitConversionTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(UnitConversion, UnitConversionTC),
});

UnitConversionTC.addRelation('baseUnit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.baseUnit,
    },
    projection: { unit: true },
});

UnitConversionTC.addRelation('rules', {
    resolver: () => ConversionRuleTC.mongooseResolvers.findByIds(),
    prepareArgs: {
        _ids: (source) => source.rules,
    },
    projection: { rules: true },
});

export const UnitConversionQuery = {
    unitConversionById: UnitConversionTC.mongooseResolvers
        .findById()
        .setDescription('Retrieve a unit conversion by its ID'),
    unitConversionByIds: UnitConversionTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple unit conversions by their IDs'),
    unitConversionOne: UnitConversionTC.mongooseResolvers
        .findOne()
        .setDescription('Retrieve a single unit conversion'),
    unitConversionMany: UnitConversionTC.mongooseResolvers
        .findMany()
        .setDescription('Retrieve multiple unit conversions'),
};

export const UnitConversionMutation = {
    unitConversionCreateOne: UnitConversionTC.getResolver('createOne'),
    unitConversionUpdateById: UnitConversionTC.getResolver('updateById'),
    unitConversionRemoveById: UnitConversionTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a unit conversion by its ID'),
    unitConversionRemoveOne: UnitConversionTC.mongooseResolvers
        .removeOne()
        .setDescription('Remove a single unit conversion'),
};
