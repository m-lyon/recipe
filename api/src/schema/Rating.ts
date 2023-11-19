import { RatingTC } from '../models/Rating.js';

export const RatingQuery = {
    ratingById: RatingTC.mongooseResolvers.findById(),
    ratingByIds: RatingTC.mongooseResolvers.findByIds(),
    ratingOne: RatingTC.mongooseResolvers.findOne(),
    ratingMany: RatingTC.mongooseResolvers.findMany(),
    // ratingDataLoader: RatingTC.mongooseResolvers.dataLoader(),
    // ratingDataLoaderMany: RatingTC.mongooseResolvers.dataLoaderMany(),
    // ratingCount: RatingTC.mongooseResolvers.count(),
    // ratingConnection: RatingTC.mongooseResolvers.connection(),
    // ratingPagination: RatingTC.mongooseResolvers.pagination(),
};

export const RatingMutation = {
    ratingCreateOne: RatingTC.mongooseResolvers.createOne(),
    ratingUpdateById: RatingTC.mongooseResolvers.updateById(),
    ratingUpdateOne: RatingTC.mongooseResolvers.updateOne(),
    ratingRemoveById: RatingTC.mongooseResolvers.removeById(),
    ratingRemoveOne: RatingTC.mongooseResolvers.removeOne(),
};
