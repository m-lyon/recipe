import { RatingTC } from '../models/Rating.js';

export const RatingQuery = {
    ratingById: RatingTC.mongooseResolvers.findById().setDescription('Retrieve a rating by its ID'),
    ratingByIds: RatingTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple ratings by their IDs'),
    ratingOne: RatingTC.mongooseResolvers.findOne().setDescription('Retrieve a single rating'),
    ratingMany: RatingTC.mongooseResolvers.findMany().setDescription('Retrieve multiple ratings'),
};

export const RatingMutation = {
    ratingCreateOne: RatingTC.mongooseResolvers.createOne().setDescription('Create a new rating'),
    ratingUpdateById: RatingTC.mongooseResolvers
        .updateById()
        .setDescription('Update a rating by its ID'),
    ratingUpdateOne: RatingTC.mongooseResolvers
        .updateOne()
        .setDescription('Update a single rating'),
    ratingRemoveById: RatingTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a rating by its ID'),
    ratingRemoveOne: RatingTC.mongooseResolvers
        .removeOne()
        .setDescription('Remove a single rating'),
};
