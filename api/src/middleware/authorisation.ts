import { GraphQLError } from 'graphql';
import { Document, Model, Types } from 'mongoose';
import { ResolverNextRpCb } from 'graphql-compose';

import { Image } from '../models/Image.js';
import { Ingredient } from '../models/Ingredient.js';
import { ContextImage, GraphQLContext } from '../types.js';
import { NutritionalInfo } from '../models/NutritionalInfo.js';

export function unauthenticated(): GraphQLError {
    return new GraphQLError('You are not authenticated!', {
        extensions: { code: 'UNAUTHENTICATED' },
    });
}

export function notAuthorised(): GraphQLError {
    return new GraphQLError('You are not authorised!', {
        extensions: { code: 'FORBIDDEN' },
    });
}

export const isVerified = (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => (rp) => {
    const user = rp.context.getUser();
    if (!user) {
        throw unauthenticated();
    }
    if (user.role === 'unverified') {
        throw new GraphQLError('You are not verified!', {
            extensions: { code: 'FORBIDDEN' },
        });
    }
    return next(rp);
};

export const isAdmin = (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => (rp) => {
    const user = rp.context.getUser();
    if (!user) {
        throw unauthenticated();
    }
    if (user.role !== 'admin') {
        throw notAuthorised();
    }
    return next(rp);
};

type DocumentWithOwner = Document & { owner: Types.ObjectId };
export const isDocumentOwnerOrAdmin =
    <T extends DocumentWithOwner>(Model: Model<T>): ResolverNextRpCb<unknown, GraphQLContext> =>
    (next) =>
    async (rp) => {
        const user = rp.context.getUser();
        if (!user) {
            throw unauthenticated();
        }
        const document = await Model.findById(rp.args._id);
        if (!document) {
            throw new GraphQLError('Document not found!', {
                extensions: { code: 'NOT_FOUND' },
            });
        }
        if (!document.owner.equals(user._id) && user.role !== 'admin') {
            throw notAuthorised();
        }
        return next(rp);
    };

/**
 * NutritionalInfo has no owner of its own; it is owned through its ingredient. Checks the
 * ingredient of the existing record (update/remove) and of the incoming record
 * (create/update), so an update cannot reassign a record to an ingredient the user does
 * not own.
 */
export const isNutritionalInfoOwnerOrAdmin =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const user = rp.context.getUser();
        if (!user) {
            throw unauthenticated();
        }
        const ingredientIds: unknown[] = [];
        if (rp.args._id) {
            const existing = await NutritionalInfo.findById(rp.args._id);
            if (!existing) {
                throw new GraphQLError('NutritionalInfo not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            ingredientIds.push(existing.ingredient);
        }
        const incoming = rp.args.record?.ingredient;
        if (incoming && !ingredientIds.some((id) => String(id) === String(incoming))) {
            ingredientIds.push(incoming);
        }
        if (user.role === 'admin') {
            return next(rp);
        }
        for (const ingredientId of ingredientIds) {
            const ingredient = await Ingredient.findById(ingredientId);
            if (!ingredient) {
                throw new GraphQLError('Ingredient not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            if (!ingredient.owner.equals(user._id)) {
                throw notAuthorised();
            }
        }
        return next(rp);
    };

export const isImageOwnerOrAdmin =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const user = rp.context.getUser();
        if (!user) {
            throw unauthenticated();
        }
        const images = (await Image.find({ _id: { $in: rp.args.ids } }).populate<{
            recipe: ContextImage['recipe'];
        }>({
            path: 'recipe',
            select: 'owner',
        })) as ContextImage[];
        // Ensure user has permission to remove any and all images
        images.forEach((image) => {
            if (!image.recipe.owner.equals(user._id) && user.role !== 'admin') {
                throw notAuthorised();
            }
        });
        rp.context.images = images;
        return next(rp);
    };
