// Cuisine GraphQL schema

import { CuisineTC } from '../models/Cuisine.js';

export const CuisineQuery = {
    cuisineById: CuisineTC.mongooseResolvers.findById(),
    cuisineByIds: CuisineTC.mongooseResolvers.findByIds(),
    cuisineOne: CuisineTC.mongooseResolvers.findOne(),
    cuisineMany: CuisineTC.mongooseResolvers.findMany(),
    // cuisineDataLoader: CuisineTC.mongooseResolvers.dataLoader(),
    // cuisineDataLoaderMany: CuisineTC.mongooseResolvers.dataLoaderMany(),
    // cuisineCount: CuisineTC.mongooseResolvers.count(),
    // cuisineConnection: CuisineTC.mongooseResolvers.connection(),
    // cuisinePagination: CuisineTC.mongooseResolvers.pagination(),
};

export const CuisineMutation = {
    cuisineCreateOne: CuisineTC.mongooseResolvers.createOne(),
    cuisineUpdateById: CuisineTC.mongooseResolvers.updateById(),
    cuisineUpdateOne: CuisineTC.mongooseResolvers.updateOne(),
    cuisineRemoveById: CuisineTC.mongooseResolvers.removeById(),
    cuisineRemoveOne: CuisineTC.mongooseResolvers.removeOne(),
};
