import { rule, shield, or, allow, deny } from 'graphql-shield';
import { Recipe } from '../models/Recipe.js';

const isAuthenticated = rule({ cache: 'contextual' })(async (parent, args, ctx, info) => {
    return ctx.isAuthenticated();
});

const isAdmin = rule({ cache: 'contextual' })(async (parent, args, ctx, info) => {
    const user = ctx.getUser();
    return user.role === 'admin';
});

const isRecipeOwner = rule({ cache: 'strict' })(async (parent, args, ctx, info) => {
    const user = ctx.getUser();
    const recipe = await Recipe.findById(args._id);
    if (!recipe) {
        return false;
    }
    return recipe.owner.equals(user._id);
});

// Permissions
export const permissions = shield(
    {
        Query: { '*': allow },
        Mutation: {
            '*': isAdmin,
            login: allow,
            logout: allow,
            register: allow,
            recipeCreateOne: isAuthenticated,
            recipeUpdateById: or(isAdmin, isRecipeOwner),
            recipeUpdateOne: or(isAdmin, isRecipeOwner),
            recipeRemoveById: or(isAdmin, isRecipeOwner),
            recipeRemoveOne: or(isAdmin, isRecipeOwner),
        },
    },
    {
        allowExternalErrors: true,
    }
);
