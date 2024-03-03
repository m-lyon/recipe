import { SchemaComposer } from 'graphql-compose';
import { TagQuery, TagMutation } from './Tag.js';
import { UnitQuery, UnitMutation } from './Unit.js';
import { UserQuery, UserMutation } from './User.js';
import { PrepMethodQuery, PrepMethodMutation } from './PrepMethod.js';
import { IngredientQuery, IngredientMutation } from './Ingredient.js';
import { RecipeQuery, RecipeMutation } from './Recipe.js';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { isAdmin, isAuthenticated, isRecipeOwnerOrAdmin } from '../middleware/authorisation.js';
import { RatingMutation, RatingQuery } from './Rating.js';
import { ImageMutation, ImageQuery } from './Image.js';

const isAdminMutations = composeResolvers(
    {
        Mutation: {
            ...TagMutation,
            ...UnitMutation,
            ...PrepMethodMutation,
            ...IngredientMutation,
        },
    },
    { 'Mutation.*': [isAdmin()] }
);
const isAuthenticatedMutations = composeResolvers(
    {
        Mutation: {
            recipeCreateOne: RecipeMutation.recipeCreateOne,
            ratingCreateOne: RatingMutation.ratingCreateOne,
        },
    },
    { 'Mutation.*': [isAuthenticated()] }
);
const isOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            recipeUpdateById: RecipeMutation.recipeUpdateById,
            recipeRemoveById: RecipeMutation.recipeRemoveById,
            imageUploadOne: ImageMutation.imageUploadOne,
            imageUploadMany: ImageMutation.imageUploadMany,
        },
    },
    { 'Mutation.*': [isRecipeOwnerOrAdmin()] }
);

const schemaComposer = new SchemaComposer();
schemaComposer.Query.addFields({
    ...TagQuery,
    ...UserQuery,
    ...UnitQuery,
    ...PrepMethodQuery,
    ...IngredientQuery,
    ...RecipeQuery,
    ...RatingQuery,
    ...ImageQuery,
});
schemaComposer.Mutation.addFields({
    ...UserMutation,
    ...isAdminMutations.Mutation,
    ...isAuthenticatedMutations.Mutation,
    ...isOwnerOrAdminMutations.Mutation,
});

export const schema = schemaComposer.buildSchema();
