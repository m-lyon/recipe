import { setRecordOwnerAsUser } from '../middleware/create.js';
import { Size, SizeCreateTC, SizeTC } from '../models/Size.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { validateItemNotInRecipe } from '../utils/deleteValidation.js';
import { filterIsOwnerOrAdmin, filterIsUnique } from '../middleware/filters.js';

SizeTC.addResolver({
    name: 'updateById',
    description: 'Update a size by its ID',
    type: SizeTC.mongooseResolvers.updateById().getType(),
    args: SizeTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Size, SizeTC),
});

SizeCreateTC.addResolver({
    name: 'createOne',
    description: 'Create a new size',
    type: SizeTC.mongooseResolvers.createOne().getType(),
    args: SizeCreateTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(Size, SizeCreateTC),
});

export const SizeQuery = {
    sizeById: SizeTC.mongooseResolvers.findById().setDescription('Retrieve a size by its ID'),
    sizeByIds: SizeTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple sizes by their IDs'),
    sizeOne: SizeTC.mongooseResolvers.findOne().setDescription('Retrieve a single size'),
    sizeMany: SizeTC.mongooseResolvers
        .findMany()
        .wrapResolve(filterIsOwnerOrAdmin())
        .wrapResolve(filterIsUnique())
        .setDescription('Retrieve multiple sizes'),
};

export const SizeQueryAdmin = {
    sizeManyAll: SizeTC.mongooseResolvers.findMany().setDescription('Retrieve all sizes'),
};

export const SizeMutation = {
    sizeCreateOne: SizeCreateTC.getResolver('createOne').wrapResolve(setRecordOwnerAsUser()),
    sizeUpdateById: SizeTC.getResolver('updateById'),
    sizeUpdateOne: SizeTC.mongooseResolvers.updateOne().setDescription('Update a single size'),
    sizeRemoveById: SizeTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a size by its ID')
        .wrapResolve((next) => async (rp) => {
            await validateItemNotInRecipe(rp.args._id, 'size');
            return next(rp);
        }),
};
