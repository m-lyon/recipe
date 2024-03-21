import { Model } from 'mongoose';
import { schemaComposer } from 'graphql-compose';
import { GraphQLError, GraphQLList } from 'graphql';
import { RecipeIngredientTC, RecipeModifyTC, RecipeQueryTC } from '../models/Recipe.js';
import { generateRecipeIdentifier } from '../models/Recipe.js';
import { TagTC } from '../models/Tag.js';
import { UnitTC } from '../models/Unit.js';
import { Ingredient, IngredientTC } from '../models/Ingredient.js';
import { PrepMethodTC } from '../models/PrepMethod.js';
import { ImageTC } from '../models/Image.js';

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

RecipeIngredientTC.addResolver({
    name: 'ingredientOrRecipe',
    type: IngredientOrRecipeTC,
    description: 'Determine if the object is an ingredient or a recipe and return the appropriate type',
    args: { _id: 'MongoID!' },
    resolve: async ({ args }) => {
        const { _id } = args;
        const ingredientDoc = await IngredientTC.mongooseResolvers.findById().resolve({ args: { _id } });
        if (ingredientDoc) {
            return ingredientDoc;
        }
        const recipeDoc = await RecipeQueryTC.mongooseResolvers.findById().resolve({ args: { _id } });
        if (recipeDoc) {
            return recipeDoc;
        }
        throw new GraphQLError('Ingredient or recipe not found');
    }
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
    recipeCreateOne: RecipeModifyTC.mongooseResolvers
        .createOne()
        .wrapResolve((next) => async (rp) => {
            rp.args.record.titleIdentifier = generateRecipeIdentifier(rp.args.record.title);
            return next(rp);
        })
        .setDescription('Create a new recipe'),
    recipeUpdateById: RecipeModifyTC.mongooseResolvers
        .updateById()
        .setDescription('Update a recipe by its ID'),
    // not used because resolver logic would need to be updated to find via findOne
    // recipeUpdateOne: RecipeTC.mongooseResolvers.updateOne(),
    recipeRemoveById: RecipeModifyTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a recipe by its ID'),
};
