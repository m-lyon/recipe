import { SchemaComposer } from 'graphql-compose';
import { TagQuery, TagMutation } from './Tag.js';
import { UnitQuery, UnitMutation } from './Unit.js';
import { UserQuery, UserMutation } from './User.js';
import { PrepMethodQuery, PrepMethodMutation } from './PrepMethod.js';
import { IngredientQuery, IngredientMutation } from './Ingredient.js';
import { RecipeQuery, RecipeMutation } from './Recipe.js';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { isAdmin, isAuthenticated, isDocumentOwnerOrAdmin } from '../middleware/authorisation.js';
import { RatingMutation, RatingQuery } from './Rating.js';
import { ImageMutation, ImageQuery } from './Image.js';
import { Recipe } from '../models/Recipe.js';
import { Unit } from '../models/Unit.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';

const isAdminMutations = composeResolvers(
    {
        Mutation: {
            ...TagMutation,
        },
    },
    { 'Mutation.*': [isAdmin()] }
);
const isAdminQueries = composeResolvers(
    {
        Query: {
            unitManyAll: UnitQuery.unitManyAll,
        },
    },
    { 'Query.*': [isAdmin()] }
);
const isAuthenticatedMutations = composeResolvers(
    {
        Mutation: {
            recipeCreateOne: RecipeMutation.recipeCreateOne,
            ratingCreateOne: RatingMutation.ratingCreateOne,
            unitCreateOne: UnitMutation.unitCreateOne,
            prepMethodCreateOne: PrepMethodMutation.prepMethodCreateOne,
            ingredientCreateOne: IngredientMutation.ingredientCreateOne,
        },
    },
    { 'Mutation.*': [isAuthenticated()] }
);
const isRecipeOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            recipeUpdateById: RecipeMutation.recipeUpdateById,
            recipeRemoveById: RecipeMutation.recipeRemoveById,
            imageUploadOne: ImageMutation.imageUploadOne,
            imageUploadMany: ImageMutation.imageUploadMany,
        },
    },
    { 'Mutation.*': [isDocumentOwnerOrAdmin(Recipe)] }
);
const isUnitOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            unitUpdateById: UnitMutation.unitUpdateById,
            unitRemoveById: UnitMutation.unitRemoveById,
        },
    },
    { 'Mutation.*': [isDocumentOwnerOrAdmin(Unit)] }
);
const isIngredientOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            ingredientUpdateById: IngredientMutation.ingredientUpdateById,
            ingredientRemoveById: IngredientMutation.ingredientRemoveById,
        },
    },
    { 'Mutation.*': [isDocumentOwnerOrAdmin(Ingredient)] }
);
const isPrepMethodOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            prepMethodUpdateById: PrepMethodMutation.prepMethodUpdateById,
            prepMethodRemoveById: PrepMethodMutation.prepMethodRemoveById,
        },
    },
    { 'Mutation.*': [isDocumentOwnerOrAdmin(PrepMethod)] }
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
    ...isAdminQueries.Query,
});
schemaComposer.Mutation.addFields({
    ...UserMutation,
    ...isAdminMutations.Mutation,
    ...isAuthenticatedMutations.Mutation,
    ...isRecipeOwnerOrAdminMutations.Mutation,
    ...isUnitOwnerOrAdminMutations.Mutation,
    ...isIngredientOwnerOrAdminMutations.Mutation,
    ...isPrepMethodOwnerOrAdminMutations.Mutation,
});

export const schema = schemaComposer.buildSchema();
