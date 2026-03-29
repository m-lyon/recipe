import { GraphQLError } from 'graphql';
import { schemaComposer } from 'graphql-compose';

import { Ingredient } from '../models/Ingredient.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import {
    NutritionalInfo,
    NutritionalInfoCreateTC,
    NutritionalInfoTC,
} from '../models/NutritionalInfo.js';

async function assertIngredientOwnerOrAdmin(
    ingredientId: unknown,
    userId: unknown,
    isUserAdmin: boolean
) {
    // Explicit auth check before ownership check
    if (!userId) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    if (isUserAdmin) return;
    const ingr = await Ingredient.findById(ingredientId);
    if (!ingr) {
        throw new GraphQLError('Ingredient not found', {
            extensions: { code: 'NOT_FOUND' },
        });
    }
    if (String(ingr.owner) !== String(userId)) {
        throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' },
        });
    }
}

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
    nutritionalInfoByIngredient: NutritionalInfoTC.mongooseResolvers
        .findOne()
        .wrapResolve((next) => async (rp) => {
            if (!rp.context.getUser()) {
                throw new GraphQLError('Not authenticated', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            return next(rp);
        }),
    nutritionalInfosByIngredientIds: schemaComposer.createResolver({
        name: 'nutritionalInfosByIngredientIds',
        type: [NutritionalInfoTC],
        args: { ingredientIds: '[MongoID!]!' },
        resolve: async ({ args, context }) => {
            if (!context.getUser()) {
                throw new GraphQLError('Not authenticated', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            return NutritionalInfo.find({ ingredient: { $in: args.ingredientIds } });
        },
    }),
};

export const NutritionalInfoMutation = {
    nutritionalInfoCreateOne: NutritionalInfoCreateTC.getResolver('createOne').wrapResolve(
        (next) => async (rp) => {
            const user = rp.context.getUser();
            const isUserAdmin = user?.role === 'admin';
            await assertIngredientOwnerOrAdmin(rp.args.record.ingredient, user?._id, isUserAdmin);
            return next(rp);
        }
    ),
    nutritionalInfoUpdateById: NutritionalInfoTC.getResolver('updateById').wrapResolve(
        (next) => async (rp) => {
            const existing = await NutritionalInfo.findById(rp.args._id);
            if (!existing) {
                throw new GraphQLError('NutritionalInfo not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            const user = rp.context.getUser();
            const isUserAdmin = user?.role === 'admin';
            await assertIngredientOwnerOrAdmin(existing.ingredient, user?._id, isUserAdmin);
            return next(rp);
        }
    ),
    nutritionalInfoRemoveById: NutritionalInfoTC.mongooseResolvers
        .removeById()
        .wrapResolve((next) => async (rp) => {
            const existing = await NutritionalInfo.findById(rp.args._id);
            if (!existing) {
                throw new GraphQLError('NutritionalInfo not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            const user = rp.context.getUser();
            const isUserAdmin = user?.role === 'admin';
            await assertIngredientOwnerOrAdmin(existing.ingredient, user?._id, isUserAdmin);
            return next(rp);
        }),
};
