import { OwnerTC } from '../models/User.js';
import { setRecordOwnerAsUser } from '../middleware/create.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { validateItemNotInMeasure, validateItemNotInRecipe } from './validation.js';
import { PrepMethod, PrepMethodCreateTC, PrepMethodTC } from '../models/PrepMethod.js';
import { filterIsEditable, filterIsUnique, filterIsVisible } from '../middleware/filters.js';

PrepMethodTC.addRelation('owner', {
    resolver: () => OwnerTC.getResolver('findById'),
    prepareArgs: { _id: (source) => source.owner },
    projection: { owner: true },
});

PrepMethodTC.addResolver({
    name: 'updateById',
    description: 'Update a prep method by its ID',
    type: PrepMethodTC.mongooseResolvers.updateById().getType(),
    args: PrepMethodTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(PrepMethod, PrepMethodTC),
});

PrepMethodCreateTC.addResolver({
    name: 'createOne',
    description: 'Create a new prep method',
    type: PrepMethodTC.mongooseResolvers.createOne().getType(),
    args: PrepMethodCreateTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(PrepMethod, PrepMethodCreateTC),
});

export const PrepMethodQuery = {
    prepMethodById: PrepMethodTC.mongooseResolvers
        .findById()
        .setDescription('Retrieve a prep method by its ID'),
    prepMethodByIds: PrepMethodTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple prep methods by their IDs'),
    prepMethodOne: PrepMethodTC.mongooseResolvers
        .findOne()
        .setDescription('Retrieve a single prep method'),
    prepMethodMany: PrepMethodTC.mongooseResolvers
        .findMany()
        .wrapResolve(filterIsVisible())
        .wrapResolve(filterIsUnique())
        .setDescription('Retrieve multiple prep methods'),
    prepMethodManyEditable: PrepMethodTC.mongooseResolvers
        .findMany()
        .wrapResolve(filterIsEditable())
        .wrapResolve(filterIsUnique())
        .setDescription('Retrieve the prep methods the current user can edit'),
};

export const PrepMethodQueryAdmin = {
    prepMethodManyAll: PrepMethodTC.mongooseResolvers
        .findMany()
        .setDescription('Retrieve all prep methods'),
};

export const PrepMethodMutation = {
    prepMethodCreateOne:
        PrepMethodCreateTC.getResolver('createOne').wrapResolve(setRecordOwnerAsUser()),
    prepMethodUpdateById: PrepMethodTC.getResolver('updateById'),
    prepMethodUpdateOne: PrepMethodTC.mongooseResolvers
        .updateOne()
        .setDescription('Update a single prep method'),
    prepMethodRemoveById: PrepMethodTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a prep method by its ID')
        .wrapResolve((next) => async (rp) => {
            await validateItemNotInRecipe(rp.args._id, 'prepMethod');
            await validateItemNotInMeasure(rp.args._id, 'prepMethod');
            return next(rp);
        }),
};
