import { Model, Document, Types } from 'mongoose';
import { Recipe } from '../models/Recipe.js';

export const isAuthenticated = () => (next) => (resolveParams) => {
    if (!resolveParams.context.getUser()) {
        throw new Error('You are not authenticated!');
    }
    return next(resolveParams);
};

export const isAdmin = () => (next) => (resolveParams) => {
    const user = resolveParams.context.getUser();
    if (user.role !== 'admin') {
        throw new Error('You are not authorized!');
    }
    return next(resolveParams);
};

export const isRecipeOwner = () => (next) => async (resolveParams) => {
    const user = resolveParams.context.getUser();
    if (!user) {
        throw new Error('You are not authenticated!');
    }
    const recipe = await Recipe.findById(resolveParams._id);
    if (!recipe) {
        throw new Error('Recipe not found!');
    }
    if (!recipe.owner.equals(user._id)) {
        throw new Error('You are not authorized!');
    }
    return next(resolveParams);
};

type DocumentWithOwner = Document & { owner: Types.ObjectId };
export const isDocumentOwnerOrAdmin =
    <T extends DocumentWithOwner>(Model: Model<T>) =>
    (next) =>
    async (resolveParams) => {
        const user = resolveParams.context.getUser();
        if (!user) {
            throw new Error('You are not authenticated!');
        }
        const document = await Model.findById(resolveParams.args._id);
        if (!document) {
            throw new Error('Document not found!');
        }
        if (!(document.owner as Types.ObjectId).equals(user._id) && user.role !== 'admin') {
            throw new Error('You are not authorized!');
        }
        return next(resolveParams);
    };
