import { updateByIdResolver } from './utils.js';
import { setRecordOwnerAsUser } from '../middleware/create.js';
import { Unit, UnitCreateTC, UnitTC } from '../models/Unit.js';
import { filterIsOwnerOrAdmin } from '../middleware/filters.js';

UnitTC.addResolver({
    name: 'updateById',
    description: 'Update a unit by its ID',
    type: UnitTC.mongooseResolvers.updateById().getType(),
    args: UnitTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Unit, UnitTC),
});

export const UnitQuery = {
    unitById: UnitTC.mongooseResolvers.findById().setDescription('Retrieve a unit by its ID'),
    unitByIds: UnitTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple units by their IDs'),
    unitOne: UnitTC.mongooseResolvers.findOne().setDescription('Retrieve a single unit'),
    unitMany: UnitTC.mongooseResolvers
        .findMany()
        .wrapResolve(filterIsOwnerOrAdmin())
        .setDescription('Retrieve multiple units'),
    unitManyAll: UnitTC.mongooseResolvers.findMany().setDescription('Retrieve all units'),
};

export const UnitMutation = {
    unitCreateOne: UnitCreateTC.mongooseResolvers
        .createOne()
        .wrapResolve(setRecordOwnerAsUser())
        .setDescription('Create a new unit'),
    unitUpdateById: UnitTC.getResolver('updateById'),
    unitRemoveById: UnitTC.mongooseResolvers.removeById().setDescription('Remove a unit by its ID'),
    unitRemoveOne: UnitTC.mongooseResolvers.removeOne().setDescription('Remove a single unit'),
};
