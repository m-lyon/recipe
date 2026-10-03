import { schemaComposer } from 'graphql-compose';

import { NutritionalInfoTC } from '../models/NutritionalInfo.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { NutritionalInfo, NutritionalInfoCreateTC } from '../models/NutritionalInfo.js';

NutritionalInfoCreateTC.addResolver({
    name: 'createOne',
    type: NutritionalInfoTC.mongooseResolvers.createOne().getType(),
    args: NutritionalInfoCreateTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(NutritionalInfo, NutritionalInfoCreateTC),
});

NutritionalInfoTC.addResolver({
    name: 'updateById',
    type: NutritionalInfoTC.mongooseResolvers.updateById().getType(),
    args: NutritionalInfoTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(NutritionalInfo, NutritionalInfoTC),
});

export const NutritionalInfoQuery = {
    nutritionalInfoByIngredient: NutritionalInfoTC.mongooseResolvers.findOne(),
    nutritionalInfosByIngredientIds: schemaComposer.createResolver({
        name: 'nutritionalInfosByIngredientIds',
        type: [NutritionalInfoTC],
        args: { ingredientIds: '[MongoID!]!' },
        resolve: async ({ args }) => {
            return NutritionalInfo.find({ ingredient: { $in: args.ingredientIds } });
        },
    }),
};

export const NutritionalInfoMutation = {
    nutritionalInfoCreateOne: NutritionalInfoCreateTC.getResolver('createOne'),
    nutritionalInfoUpdateById: NutritionalInfoTC.getResolver('updateById'),
    nutritionalInfoRemoveById: NutritionalInfoTC.mongooseResolvers.removeById(),
};
