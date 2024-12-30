import { SchemaComposer } from 'graphql-compose';
import { composeResolvers } from '@graphql-tools/resolvers-composition';

import { Unit } from '../models/Unit.js';
import { Size } from '../models/Size.js';
import { Recipe } from '../models/Recipe.js';
import { TagMutation, TagQuery } from './Tag.js';
import { UserMutation, UserQuery } from './User.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';
import { ImageMutation, ImageQuery } from './Image.js';
import { RecipeMutation, RecipeQuery } from './Recipe.js';
import { RatingMutation, RatingQuery } from './Rating.js';
import { SizeMutation, SizeQuery, SizeQueryAdmin } from './Size.js';
import { UnitMutation, UnitQuery, UnitQueryAdmin } from './Unit.js';
import { IngredientMutation, IngredientQuery } from './Ingredient.js';
import { isAdmin, isImageOwnerOrAdmin } from '../middleware/authorisation.js';
import { UnitConversionMutation, UnitConversionQuery } from './UnitConversion.js';
import { ConversionRuleMutation, ConversionRuleQuery } from './UnitConversion.js';
import { isDocumentOwnerOrAdmin, isVerified } from '../middleware/authorisation.js';
import { PrepMethodMutation, PrepMethodQuery, PrepMethodQueryAdmin } from './PrepMethod.js';

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
            ...SizeQueryAdmin,
            ...UnitQueryAdmin,
            ...PrepMethodQueryAdmin,
        },
    },
    { 'Query.*': [isAdmin()] }
);
const isAuthenticatedMutations = composeResolvers(
    {
        Mutation: {
            recipeCreateOne: RecipeMutation.recipeCreateOne,
            ratingCreateOne: RatingMutation.ratingCreateOne,
            sizeCreateOne: SizeMutation.sizeCreateOne,
            unitCreateOne: UnitMutation.unitCreateOne,
            prepMethodCreateOne: PrepMethodMutation.prepMethodCreateOne,
            ingredientCreateOne: IngredientMutation.ingredientCreateOne,
        },
    },
    { 'Mutation.*': [isVerified()] }
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
const isSizeOwnerOrAdminMutations = composeResolvers(
    {
        Mutation: {
            sizeUpdateById: SizeMutation.sizeUpdateById,
            sizeRemoveById: SizeMutation.sizeRemoveById,
        },
    },
    { 'Mutation.*': [isDocumentOwnerOrAdmin(Size)] }
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
    ...SizeQuery,
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
    ...isSizeOwnerOrAdminMutations.Mutation,
    ...isIngredientOwnerOrAdminMutations.Mutation,
    ...isPrepMethodOwnerOrAdminMutations.Mutation,
    ...isImageOwnerOrAdminMutations.Mutation,
});

export const schema = schemaComposer.buildSchema();
