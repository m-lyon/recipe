import { schemaComposer } from 'graphql-compose';

import { PrepMethodTC } from '../models/PrepMethod.js';
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

// After the resolvers, so their inputs keep prepMethod as an id.
NutritionalInfoTC.addRelation('prepMethod', {
    resolver: () => PrepMethodTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.prepMethod },
    projection: { prepMethod: true },
});

export const NutritionalInfoQuery = {
    // Every record of each ingredient: the one with no prep method, and one for each prep
    // method that changes the food, such as juiced.
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
