import { Tag, TagTC } from '../models/Tag.js';
import { createOneResolver, updateByIdResolver } from './utils.js';

TagTC.addResolver({
    name: 'updateById',
    description: 'Update a tag by its ID',
    type: TagTC.mongooseResolvers.updateById().getType(),
    args: TagTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Tag, TagTC),
});

TagTC.addResolver({
    name: 'createOne',
    description: 'Create a new tag',
    type: TagTC.mongooseResolvers.createOne().getType(),
    args: TagTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(Tag, TagTC),
});

export const TagQuery = {
    tagById: TagTC.mongooseResolvers.findById().setDescription('Retrieve a tag by its ID'),
    tagByIds: TagTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple tags by their IDs'),
    tagOne: TagTC.mongooseResolvers.findOne().setDescription('Retrieve a single tag'),
    tagMany: TagTC.mongooseResolvers.findMany().setDescription('Retrieve multiple tags'),
};

export const TagMutation = {
    tagCreateOne: TagTC.getResolver('createOne'),
    tagUpdateById: TagTC.getResolver('updateById'),
    tagRemoveById: TagTC.mongooseResolvers.removeById().setDescription('Remove a tag by its ID'),
    tagRemoveOne: TagTC.mongooseResolvers.removeOne().setDescription('Remove a single tag'),
};
