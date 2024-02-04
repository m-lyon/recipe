import { UnitTC } from '../models/Unit.js';

export const UnitQuery = {
    unitById: UnitTC.mongooseResolvers.findById().setDescription('Retrieve a unit by its ID'),
    unitByIds: UnitTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple units by their IDs'),
    unitOne: UnitTC.mongooseResolvers.findOne().setDescription('Retrieve a single unit'),
    unitMany: UnitTC.mongooseResolvers.findMany().setDescription('Retrieve multiple units'),
};

export const UnitMutation = {
    unitCreateOne: UnitTC.mongooseResolvers.createOne().setDescription('Create a new unit'),
    unitUpdateById: UnitTC.mongooseResolvers.updateById().setDescription('Update a unit by its ID'),
    unitUpdateOne: UnitTC.mongooseResolvers.updateOne().setDescription('Update a single unit'),
    unitRemoveById: UnitTC.mongooseResolvers.removeById().setDescription('Remove a unit by its ID'),
    unitRemoveOne: UnitTC.mongooseResolvers.removeOne().setDescription('Remove a single unit'),
};
