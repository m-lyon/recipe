import { PrepMethodTC } from '../models/PrepMethod.js';

export const PrepMethodQuery = {
    prepMethodById: PrepMethodTC.mongooseResolvers.findById(),
    prepMethodByIds: PrepMethodTC.mongooseResolvers.findByIds(),
    prepMethodOne: PrepMethodTC.mongooseResolvers.findOne(),
    prepMethodMany: PrepMethodTC.mongooseResolvers.findMany(),
    prepMethodDataLoader: PrepMethodTC.mongooseResolvers.dataLoader(),
    prepMethodDataLoaderMany: PrepMethodTC.mongooseResolvers.dataLoaderMany(),
    prepMethodCount: PrepMethodTC.mongooseResolvers.count(),
    prepMethodConnection: PrepMethodTC.mongooseResolvers.connection(),
    prepMethodPagination: PrepMethodTC.mongooseResolvers.pagination(),
};

export const PrepMethodMutation = {
    prepMethodCreateOne: PrepMethodTC.mongooseResolvers.createOne(),
    prepMethodCreateMany: PrepMethodTC.mongooseResolvers.createMany(),
    prepMethodUpdateById: PrepMethodTC.mongooseResolvers.updateById(),
    prepMethodUpdateOne: PrepMethodTC.mongooseResolvers.updateOne(),
    prepMethodUpdateMany: PrepMethodTC.mongooseResolvers.updateMany(),
    prepMethodRemoveById: PrepMethodTC.mongooseResolvers.removeById(),
    prepMethodRemoveOne: PrepMethodTC.mongooseResolvers.removeOne(),
    prepMethodRemoveMany: PrepMethodTC.mongooseResolvers.removeMany(),
};
