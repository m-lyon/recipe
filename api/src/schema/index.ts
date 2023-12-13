import { SchemaComposer } from 'graphql-compose';
import { TagQuery, TagMutation } from './Tag.js';
import { UnitQuery, UnitMutation } from './Unit.js';
import { UserQuery, UserMutation } from './User.js';
import { PrepMethodQuery, PrepMethodMutation } from './PrepMethod.js';
import { IngredientQuery, IngredientMutation } from './Ingredient.js';
import { RecipeQuery, RecipeMutation } from './Recipe.js';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { isAdmin, isAuthenticated, isRecipeOwnerOrAdmin } from '../middleware/resolvers.js';

const defaultMutations = composeResolvers(
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
const recipeCreateMutation = composeResolvers(
    {
        Mutation: { recipeCreateOne: RecipeMutation.recipeCreateOne },
    },
    { 'Mutation.*': [isAuthenticated()] }
);
const recipeModifyMutation = composeResolvers(
    {
        Mutation: {
            recipeUpdateById: RecipeMutation.recipeUpdateById,
            recipeRemoveById: RecipeMutation.recipeRemoveById,
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
});
schemaComposer.Mutation.addFields({
    ...UserMutation,
    ...defaultMutations.Mutation,
    ...recipeCreateMutation.Mutation,
    ...recipeModifyMutation.Mutation,
});

export const schema = schemaComposer.buildSchema();
