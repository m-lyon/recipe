import { setRecordOwnerAsUser } from '../middleware/create.js';
import { Unit, UnitCreateTC, UnitTC } from '../models/Unit.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { validateUnitCreate, validateUnitUpdate } from './validation.js';
import { filterIsOwnerOrAdmin, filterIsUnique } from '../middleware/filters.js';
import { validateUnitNotInLadder, validateUnitNotStandard } from './validation.js';
import { validateItemNotInMeasure, validateItemNotInRecipe } from './validation.js';

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

// Mongoose fills in the default, so a stored unit always has a value.
UnitTC.extendField('hidden', { type: 'Boolean!' });

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
    unitCreateOne: UnitCreateTC.getResolver('createOne')
        .wrapResolve(setRecordOwnerAsUser())
        .wrapResolve((next) => (rp) => {
            validateUnitCreate(rp.args.record, rp.context.getUser()?.role === 'admin');
            return next(rp);
        }),
    unitUpdateById: UnitTC.getResolver('updateById').wrapResolve((next) => async (rp) => {
        await validateUnitUpdate(
            rp.args._id,
            rp.args.record,
            rp.context.getUser()?.role === 'admin'
        );
        return next(rp);
    }),
    unitRemoveById: UnitTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a unit by its ID')
        .wrapResolve((next) => async (rp) => {
            await validateUnitNotStandard(rp.args._id);
            await validateItemNotInRecipe(rp.args._id, 'unit');
            await validateItemNotInMeasure(rp.args._id, 'unit');
            await validateUnitNotInLadder(rp.args._id);
            return next(rp);
        }),
};
