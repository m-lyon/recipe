// Tag GraphQL schema

import { TagTC } from '../models/Tag.js';

export const TagQuery = {
    tagById: TagTC.mongooseResolvers.findById(),
    tagByIds: TagTC.mongooseResolvers.findByIds(),
    tagOne: TagTC.mongooseResolvers.findOne(),
    tagMany: TagTC.mongooseResolvers.findMany(),
    tagDataLoader: TagTC.mongooseResolvers.dataLoader(),
    tagDataLoaderMany: TagTC.mongooseResolvers.dataLoaderMany(),
    tagCount: TagTC.mongooseResolvers.count(),
    tagConnection: TagTC.mongooseResolvers.connection(),
    tagPagination: TagTC.mongooseResolvers.pagination(),
};

export const TagMutation = {
    tagCreateOne: TagTC.mongooseResolvers.createOne(),
    tagCreateMany: TagTC.mongooseResolvers.createMany(),
    tagUpdateById: TagTC.mongooseResolvers.updateById(),
    tagUpdateOne: TagTC.mongooseResolvers.updateOne(),
    tagUpdateMany: TagTC.mongooseResolvers.updateMany(),
    tagRemoveById: TagTC.mongooseResolvers.removeById(),
    tagRemoveOne: TagTC.mongooseResolvers.removeOne(),
    tagRemoveMany: TagTC.mongooseResolvers.removeMany(),
};
