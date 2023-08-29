// Cuisine GraphQL schema

import { CuisineTC } from '../models/Cuisine.js';

export const CuisineQuery = {
    cuisineById: CuisineTC.mongooseResolvers.findById(),
    cuisineByIds: CuisineTC.mongooseResolvers.findByIds(),
    cuisineOne: CuisineTC.mongooseResolvers.findOne(),
    cuisineMany: CuisineTC.mongooseResolvers.findMany(),
    cuisineDataLoader: CuisineTC.mongooseResolvers.dataLoader(),
    cuisineDataLoaderMany: CuisineTC.mongooseResolvers.dataLoaderMany(),
    cuisineCount: CuisineTC.mongooseResolvers.count(),
    cuisineConnection: CuisineTC.mongooseResolvers.connection(),
    cuisinePagination: CuisineTC.mongooseResolvers.pagination(),
};

export const CuisineMutation = {
    cuisineCreateOne: CuisineTC.mongooseResolvers.createOne(),
    cuisineCreateMany: CuisineTC.mongooseResolvers.createMany(),
    cuisineUpdateById: CuisineTC.mongooseResolvers.updateById(),
    cuisineUpdateOne: CuisineTC.mongooseResolvers.updateOne(),
    cuisineUpdateMany: CuisineTC.mongooseResolvers.updateMany(),
    cuisineRemoveById: CuisineTC.mongooseResolvers.removeById(),
    cuisineRemoveOne: CuisineTC.mongooseResolvers.removeOne(),
    cuisineRemoveMany: CuisineTC.mongooseResolvers.removeMany(),
};
