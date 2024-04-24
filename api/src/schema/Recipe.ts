import { Model } from 'mongoose';
import { schemaComposer } from 'graphql-compose';
import { GraphQLError, GraphQLList } from 'graphql';

import { TagTC } from '../models/Tag.js';
import { UnitTC } from '../models/Unit.js';
import { ImageTC } from '../models/Image.js';
import { updateByIdResolver } from './utils.js';
import { PrepMethodTC } from '../models/PrepMethod.js';
import { Ingredient, IngredientTC } from '../models/Ingredient.js';
import { RecipeModifyTC, generateRecipeIdentifier } from '../models/Recipe.js';
import { Recipe, RecipeCreateTC, RecipeIngredientTC, RecipeQueryTC } from '../models/Recipe.js';

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

RecipeModifyTC.addResolver({
    name: 'updateById',
    description: 'Update a recipe by its ID',
    type: RecipeModifyTC.mongooseResolvers.updateById().getType(),
    args: RecipeModifyTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Recipe, RecipeModifyTC),
});

RecipeIngredientTC.addResolver({
    name: 'ingredientOrRecipe',
    type: IngredientOrRecipeTC,
    description:
        'Determine if the object is an ingredient or a recipe and return the appropriate type',
    args: { _id: 'MongoID!' },
    resolve: async (rp) => {
        if (!rp?.args?._id) {
            throw new Error(
                `${IngredientOrRecipeTC.getTypeName()}.ingredientOrRecipe resolver requires args._id value`
            );
        }
        const { _id } = rp.args;

        const ingredientDoc = await IngredientTC.mongooseResolvers
            .findById()
            .resolve({ args: { _id } });
        if (ingredientDoc) {
            return ingredientDoc;
        }
        const recipeDoc = await RecipeQueryTC.mongooseResolvers
            .findById()
            .resolve({ args: { _id } });
        if (recipeDoc) {
            return recipeDoc;
        }
        throw new GraphQLError('Ingredient or recipe not found');
    },
});

RecipeQueryTC.addRelation('tags', {
    resolver: () => TagTC.mongooseResolvers.findByIds(),
    prepareArgs: {
        _ids: (source: Recipe) => source.tags?.map((o) => o._id),
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
    resolver: () => RecipeIngredientTC.getResolver('ingredientOrRecipe'),
    prepareArgs: {
        _id: (source) => source.ingredient._id,
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

RecipeQueryTC.addFields({
    images: {
        type: new GraphQLList(ImageTC.getType()),
        resolve: async (source) => {
            return await ImageTC.mongooseResolvers.findMany().resolve({
                args: { filter: { recipe: source._id } },
            });
        },
    },
});

export const RecipeQuery = {
    recipeById: RecipeQueryTC.mongooseResolvers
        .findById()
        .setDescription('Get a single recipe by its ID'),
    recipeByIds: RecipeQueryTC.mongooseResolvers
        .findByIds()
        .setDescription('Get multiple recipes by their IDs'),
    recipeOne: RecipeQueryTC.mongooseResolvers.findOne().setDescription('Get a single recipe'),
    recipeMany: RecipeQueryTC.mongooseResolvers.findMany().setDescription('Get multiple recipes'),
};

export const RecipeMutation = {
    recipeCreateOne: RecipeCreateTC.mongooseResolvers
        .createOne()
        .wrapResolve((next) => async (rp) => {
            rp.args.record.owner = rp.context.getUser();
            rp.args.record.titleIdentifier = generateRecipeIdentifier(rp.args.record.title);
            return next(rp);
        })
        .setDescription('Create a new recipe'),
    recipeUpdateById: RecipeModifyTC.getResolver('updateById'),
    recipeRemoveById: RecipeModifyTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a recipe by its ID'),
};
