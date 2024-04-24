import { updateByIdResolver } from './utils.js';
import { setRecordOwnerAsUser } from '../middleware/create.js';
import { Rating, RatingCreateTC, RatingTC } from '../models/Rating.js';

RatingTC.addResolver({
    name: 'updateById',
    description: 'Update a rating by its ID',
    type: RatingTC.mongooseResolvers.updateById().getType(),
    args: RatingTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Rating, RatingTC),
});

export const RatingQuery = {
    ratingById: RatingTC.mongooseResolvers.findById().setDescription('Retrieve a rating by its ID'),
    ratingByIds: RatingTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple ratings by their IDs'),
    ratingOne: RatingTC.mongooseResolvers.findOne().setDescription('Retrieve a single rating'),
    ratingMany: RatingTC.mongooseResolvers.findMany().setDescription('Retrieve multiple ratings'),
};

export const RatingMutation = {
    ratingCreateOne: RatingCreateTC.mongooseResolvers
        .createOne()
        .wrapResolve(setRecordOwnerAsUser())
        .setDescription('Create a new rating'),
    ratingUpdateById: RatingTC.getResolver('updateById'),
    ratingRemoveById: RatingTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a rating by its ID'),
    ratingRemoveOne: RatingTC.mongooseResolvers
        .removeOne()
        .setDescription('Remove a single rating'),
};
