import { GraphQLError } from 'graphql';
import { Document, Model, Types } from 'mongoose';
import { ResolverNextRpCb } from 'graphql-compose';

import { Image } from '../models/Image.js';
import { ContextImage, GraphQLContext } from '../types.js';

export const isVerified = (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => (rp) => {
    const user = rp.context.getUser();
    if (!user) {
        throw new GraphQLError('You are not authenticated!', {
            extensions: { code: 'FORBIDDEN' },
        });
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
    if (!user || user.role !== 'admin') {
        throw new GraphQLError('You are not authorised!', {
            extensions: { code: 'FORBIDDEN' },
        });
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
            throw new GraphQLError('You are not authenticated!', {
                extensions: { code: 'FORBIDDEN' },
            });
        }
        const document = await Model.findById(rp.args._id);
        if (!document) {
            throw new GraphQLError('Document not found!', {
                extensions: { code: 'NOT_FOUND' },
            });
        }
        if (!document.owner.equals(user._id) && user.role !== 'admin') {
            throw new GraphQLError('You are not authorised!', {
                extensions: { code: 'FORBIDDEN' },
            });
        }
        return next(rp);
    };

export const isImageOwnerOrAdmin =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const user = rp.context.getUser();
        if (!user) {
            throw new GraphQLError('You are not authenticated!', {
                extensions: { code: 'FORBIDDEN' },
            });
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
                throw new GraphQLError('You are not authorised!', {
                    extensions: { code: 'FORBIDDEN' },
                });
            }
        });
        rp.context.images = images;
        return next(rp);
    };
