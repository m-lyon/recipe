import { RecipeIngredientTC, RecipeModifyTC, RecipeQueryTC } from '../models/Recipe.js';
import { TagTC } from '../models/Tag.js';
import { UnitTC } from '../models/Unit.js';
import { Ingredient, IngredientTC } from '../models/Ingredient.js';
import { PrepMethodTC } from '../models/PrepMethod.js';
import { schemaComposer } from 'graphql-compose';
import { Model } from 'mongoose';
import { GraphQLError } from 'graphql';

const IngredientOrRecipeTC = schemaComposer.createUnionTC({
    name: 'IngredientOrRecipe',
    types: [IngredientTC.getType(), RecipeQueryTC.getType()],
    resolveType: (value: Ingredient & { constructor: typeof Model }) => {
        if (value && value.constructor) {
            return value.constructor.modelName;
        }
        return null;
    },
});

const ingredientOrRecipeResolver = schemaComposer.createResolver({
    name: 'ingredientOrRecipe',
    type: IngredientOrRecipeTC,
    args: {
        type: 'String!',
        ingredient: 'MongoID!',
    },
    resolve: async ({ args }) => {
        const { type, ingredient } = args;
        if (!type) {
            throw new GraphQLError('type is required to determine ingredient or recipe');
        }
        if (type === 'ingredient') {
            return await IngredientTC.mongooseResolvers
                .findById()
                .resolve({ args: { _id: ingredient } });
        } else if (type === 'recipe') {
            return await RecipeQueryTC.mongooseResolvers
                .findById()
                .resolve({ args: { _id: ingredient } });
        } else {
            throw new GraphQLError('Invalid type');
        }
    },
});

RecipeQueryTC.addRelation('tags', {
    resolver: () => TagTC.mongooseResolvers.findByIds(),
    prepareArgs: {
        _ids: (source) => source.tags?.map((o) => o._id),
    },
    projection: { tags: true },
});
RecipeIngredientTC.addRelation('unit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.unit?._id,
    },
    projection: { unit: true },
});
RecipeIngredientTC.addRelation('ingredient', {
    resolver: () => ingredientOrRecipeResolver,
    prepareArgs: {
        type: (source) => source.type,
        ingredient: (source) => source.ingredient._id,
    },
    projection: { ingredient: true },
});
RecipeIngredientTC.addRelation('prepMethod', {
    resolver: () => PrepMethodTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.prepMethod?._id,
    },
    projection: { prepMethod: true },
});

export const RecipeQuery = {
    recipeById: RecipeQueryTC.mongooseResolvers.findById(),
    recipeByIds: RecipeQueryTC.mongooseResolvers.findByIds(),
    recipeOne: RecipeQueryTC.mongooseResolvers.findOne(),
    recipeMany: RecipeQueryTC.mongooseResolvers.findMany(),
    // recipeDataLoader: RecipeTC.mongooseResolvers.dataLoader(),
    // recipeDataLoaderMany: RecipeTC.mongooseResolvers.dataLoaderMany(),
    // recipeCount: RecipeTC.mongooseResolvers.count(),
    // recipeConnection: RecipeTC.mongooseResolvers.connection(),
    // recipePagination: RecipeTC.mongooseResolvers.pagination(),
};

export const RecipeMutation = {
    // 'many' methods are commented out because they are not currently used
    // by frontend. They are left here for reference.
    recipeCreateOne: RecipeModifyTC.mongooseResolvers.createOne(),
    // recipeCreateMany: RecipeTC.mongooseResolvers.createMany(),
    recipeUpdateById: RecipeModifyTC.mongooseResolvers.updateById(),
    // recipeUpdateOne: RecipeTC.mongooseResolvers.updateOne(), // not used because resolver logic would need to be updated to find via findOne
    // recipeUpdateMany: RecipeTC.mongooseResolvers.updateMany(),
    recipeRemoveById: RecipeModifyTC.mongooseResolvers.removeById(),
    // recipeRemoveOne: RecipeTC.mongooseResolvers.removeOne(),
    // recipeRemoveMany: RecipeTC.mongooseResolvers.removeMany(),
};
