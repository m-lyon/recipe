import { GraphQLError } from 'graphql';
import { Document, Model, Types } from 'mongoose';

import { Image } from '../models/Image.js';

export const isVerified = () => (next) => (rp) => {
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

export const isAdmin = () => (next) => (rp) => {
    const user = rp.context.getUser();
    if (user.role !== 'admin') {
        throw new GraphQLError('You are not authorised!', {
            extensions: { code: 'FORBIDDEN' },
        });
    }
    return next(rp);
};

type DocumentWithOwner = Document & { owner: Types.ObjectId };
export const isDocumentOwnerOrAdmin =
    <T extends DocumentWithOwner>(Model: Model<T>) =>
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

export const isImageOwnerOrAdmin = () => (next) => async (rp) => {
    const user = rp.context.getUser();
    if (!user) {
        throw new GraphQLError('You are not authenticated!', {
            extensions: { code: 'FORBIDDEN' },
        });
    }
    const images = await Image.find({ _id: { $in: rp.args.ids } });
    // Ensure user has permission to remove any and all images
    images.forEach((image) => {
        if (!image.recipe._id.equals(user._id) && user.role !== 'admin') {
            throw new GraphQLError('You are not authorised!', {
                extensions: { code: 'FORBIDDEN' },
            });
        }
    });
    rp.context.images = images;
    return next(rp);
};
