import { Recipe } from '../models/Recipe.js';

export const isAuthenticated = () => (next) => (resolveParams) => {
    if (!resolveParams.root.context.getUser()) {
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

export const isRecipeOwnerOrAdmin = () => (next) => async (resolveParams) => {
    const user = resolveParams.context.getUser();
    if (!user) {
        throw new Error('You are not authenticated!');
    }
    const recipe = await Recipe.findById(resolveParams.args._id);
    console.log(recipe);
    if (!recipe) {
        throw new Error('Recipe not found!');
    }
    if (!recipe.owner.equals(user._id) && user.role !== 'admin') {
        throw new Error('You are not authorized!');
    }
    return next(resolveParams);
};
