import { Document, Model, Types } from 'mongoose';

import { Image } from '../models/Image';

export const isAuthenticated = () => (next) => (rp) => {
    if (!rp.context.getUser()) {
        throw new Error('You are not authenticated!');
    }
    return next(rp);
};

export const isAdmin = () => (next) => (rp) => {
    const user = rp.context.getUser();
    if (user.role !== 'admin') {
        throw new Error('You are not authorised!');
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
            throw new Error('You are not authenticated!');
        }
        const document = await Model.findById(rp.args._id);
        if (!document) {
            throw new Error('Document not found!');
        }
        if (!(document.owner as Types.ObjectId).equals(user._id) && user.role !== 'admin') {
            throw new Error('You are not authorised!');
        }
        return next(rp);
    };

export const isImageOwnerOrAdmin = () => (next) => async (rp) => {
    const user = rp.context.getUser();
    if (!user) {
        throw new Error('You are not authenticated!');
    }
    const images = await Image.find({ _id: { $in: rp.args.ids } });
    // Ensure user has permission to remove any and all images
    images.forEach((image) => {
        if (!image.recipe._id.equals(user._id) && user.role !== 'admin') {
            throw new Error('You are not authorised!');
        }
    });
    rp.context.images = images;
    return next(rp);
};
