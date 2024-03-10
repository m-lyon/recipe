import { PrepMethodTC } from '../models/PrepMethod.js';
import { filterIsOwnerOrAdmin } from '../middleware/filters.js';

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
        .wrapResolve(filterIsOwnerOrAdmin())
        .setDescription('Retrieve multiple prep methods'),
    prepMethodManyAll: PrepMethodTC.mongooseResolvers
        .findMany()
        .setDescription('Retrieve all prep methods'),
};

export const PrepMethodMutation = {
    prepMethodCreateOne: PrepMethodTC.mongooseResolvers
        .createOne()
        .setDescription('Create a new prep method'),
    prepMethodUpdateById: PrepMethodTC.mongooseResolvers
        .updateById()
        .setDescription('Update a prep method by its ID'),
    prepMethodUpdateOne: PrepMethodTC.mongooseResolvers
        .updateOne()
        .setDescription('Update a single prep method'),
    prepMethodRemoveById: PrepMethodTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a prep method by its ID'),
    prepMethodRemoveOne: PrepMethodTC.mongooseResolvers
        .removeOne()
        .setDescription('Remove a single prep method'),
};
