import { setRecordOwnerAsUser } from '../middleware/create.js';
import { Unit, UnitCreateTC, UnitTC } from '../models/Unit.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { validateItemNotInRecipe } from '../utils/deleteValidation.js';
import { filterIsOwnerOrAdmin, filterIsUnique } from '../middleware/filters.js';

UnitTC.addResolver({
    name: 'updateById',
    description: 'Update a unit by its ID',
    type: UnitTC.mongooseResolvers.updateById().getType(),
    args: UnitTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Unit, UnitTC),
});

UnitCreateTC.addResolver({
    name: 'createOne',
    description: 'Create a new unit',
    type: UnitTC.mongooseResolvers.createOne().getType(),
    args: UnitCreateTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(Unit, UnitCreateTC),
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
        .wrapResolve(filterIsUnique())
        .setDescription('Retrieve multiple units'),
};

export const UnitQueryAdmin = {
    unitManyAll: UnitTC.mongooseResolvers.findMany().setDescription('Retrieve all units'),
};

export const UnitMutation = {
    unitCreateOne: UnitCreateTC.getResolver('createOne').wrapResolve(setRecordOwnerAsUser()),
    unitUpdateById: UnitTC.getResolver('updateById'),
    unitRemoveById: UnitTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a unit by its ID')
        .wrapResolve((next) => async (rp) => {
            await validateItemNotInRecipe(rp.args._id, 'unit');
            return next(rp);
        }),
};
