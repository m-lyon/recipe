import { SchemaComposer } from 'graphql-compose';
import { composeResolvers } from '@graphql-tools/resolvers-composition';

import { Unit } from '../models/Unit.js';
import { Recipe } from '../models/Recipe.js';
import { TagMutation, TagQuery } from './Tag.js';
import { UnitMutation, UnitQuery } from './Unit.js';
import { UserMutation, UserQuery } from './User.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';
import { ImageMutation, ImageQuery } from './Image.js';
import { RecipeMutation, RecipeQuery } from './Recipe.js';
import { RatingMutation, RatingQuery } from './Rating.js';
import { PrepMethodMutation, PrepMethodQuery } from './PrepMethod.js';
import { IngredientMutation, IngredientQuery } from './Ingredient.js';
import { isAdmin, isImageOwnerOrAdmin } from '../middleware/authorisation.js';
import { UnitConversionMutation, UnitConversionQuery } from './UnitConversion.js';
import { ConversionRuleMutation, ConversionRuleQuery } from './UnitConversion.js';
import { isAuthenticated, isDocumentOwnerOrAdmin } from '../middleware/authorisation.js';

const isAdminMutations = composeResolvers(
    {
        Mutation: {
            ...TagMutation,
            ...UnitConversionMutation,
            ...ConversionRuleMutation,
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
const isImageOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            imageRemoveMany: ImageMutation.imageRemoveMany,
        },
    },
    { 'Mutation.*': [isImageOwnerOrAdmin()] }
);
const isRecipeOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            recipeUpdateById: RecipeMutation.recipeUpdateById,
            recipeRemoveById: RecipeMutation.recipeRemoveById,
            imageUploadOne: ImageMutation.imageUploadOne,
            imageUploadMany: ImageMutation.imageUploadMany,
            generateImages: ImageMutation.generateImages,
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
    ...UnitConversionQuery,
    ...ConversionRuleQuery,
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
    ...isImageOwnerOrAdminMutations.Mutation,
});

export const schema = schemaComposer.buildSchema();
