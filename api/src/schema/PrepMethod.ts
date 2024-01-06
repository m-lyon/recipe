import { PrepMethodTC } from '../models/PrepMethod.js';

export const PrepMethodQuery = {
    prepMethodById: PrepMethodTC.mongooseResolvers.findById(),
    prepMethodByIds: PrepMethodTC.mongooseResolvers.findByIds(),
    prepMethodOne: PrepMethodTC.mongooseResolvers.findOne(),
    prepMethodMany: PrepMethodTC.mongooseResolvers.findMany(),
};

export const PrepMethodMutation = {
    prepMethodCreateOne: PrepMethodTC.mongooseResolvers.createOne(),
    prepMethodUpdateById: PrepMethodTC.mongooseResolvers.updateById(),
    prepMethodUpdateOne: PrepMethodTC.mongooseResolvers.updateOne(),
    prepMethodRemoveById: PrepMethodTC.mongooseResolvers.removeById(),
    prepMethodRemoveOne: PrepMethodTC.mongooseResolvers.removeOne(),
};
