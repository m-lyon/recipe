import { Model } from 'mongoose';
import { schemaComposer } from 'graphql-compose';
import { GraphQLNonNull, GraphQLString } from 'graphql';
import { GraphQLError, GraphQLList, GraphQLObjectType } from 'graphql';

import { TagTC } from '../models/Tag.js';
import { SizeTC } from '../models/Size.js';
import { UnitTC } from '../models/Unit.js';
import { ImageTC } from '../models/Image.js';
import { RatingTC } from '../models/Rating.js';
import { PrepMethodTC } from '../models/PrepMethod.js';
import { Ingredient, IngredientTC } from '../models/Ingredient.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { RecipeModifyTC, generateRecipeIdentifier } from '../models/Recipe.js';
import { Recipe, RecipeCreateTC, RecipeIngredientTC, RecipeTC } from '../models/Recipe.js';

const IngredientOrRecipeTC = schemaComposer.createUnionTC({
    name: 'IngredientOrRecipe',
    types: [IngredientTC.getType(), RecipeTC.getType()],
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
    type: RecipeTC.mongooseResolvers.updateById().getType(),
    args: RecipeModifyTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Recipe, RecipeModifyTC),
});

RecipeModifyTC.addResolver({
    name: 'removeById',
    description: 'Remove a recipe by its ID',
    type: RecipeTC.mongooseResolvers.removeById().getType(),
    args: RecipeModifyTC.mongooseResolvers.removeById().getArgs(),
    resolve: RecipeModifyTC.mongooseResolvers.removeById().resolve,
});

RecipeCreateTC.addResolver({
    name: 'createOne',
    description: 'Create a new recipe',
    type: RecipeTC.mongooseResolvers.createOne().getType(),
    args: RecipeCreateTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(Recipe, RecipeCreateTC),
});

RecipeIngredientTC.addResolver({
    name: 'ingredientOrRecipe',
    type: new GraphQLNonNull(IngredientOrRecipeTC.getType()),
    description:
        'Determine if the object is an ingredient or a recipe and return the appropriate type',
    args: { _id: 'MongoID!' },
    resolve: async (rp) => {
        if (!rp?.args?._id) {
            throw new GraphQLError(
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
        const recipeDoc = await RecipeTC.mongooseResolvers.findById().resolve({ args: { _id } });
        if (recipeDoc) {
            return recipeDoc;
        }
        throw new GraphQLError('Ingredient or recipe not found');
    },
});

// This is here because the calculatedTags field in the schema constructor does
// not add non-nullability to array items.
RecipeTC.extendField('calculatedTags', {
    type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
});
RecipeTC.extendField('ingredientSubsections', {
    type: new GraphQLNonNull(
        new GraphQLList(
            new GraphQLNonNull(
                new GraphQLObjectType({
                    name: 'IngredientSubsection',
                    fields: {
                        name: { type: GraphQLString },
                        ingredients: {
                            type: new GraphQLNonNull(
                                new GraphQLList(new GraphQLNonNull(RecipeIngredientTC.getType()))
                            ),
                        },
                    },
                })
            )
        )
    ),
});
RecipeTC.extendField('instructionSubsections', {
    type: new GraphQLNonNull(
        new GraphQLList(
            new GraphQLNonNull(
                new GraphQLObjectType({
                    name: 'InstructionSubsection',
                    fields: {
                        name: { type: GraphQLString },
                        instructions: {
                            type: new GraphQLNonNull(
                                new GraphQLList(new GraphQLNonNull(GraphQLString))
                            ),
                        },
                    },
                })
            )
        )
    ),
});

RecipeTC.addRelation('tags', {
    resolver: () => TagTC.mongooseResolvers.findByIds(),
    prepareArgs: { _ids: (source: Recipe) => source.tags?.map((o) => o._id) },
    projection: { tags: true },
});

RecipeIngredientTC.addRelation('unit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.unit },
    projection: { unit: true },
});
RecipeIngredientTC.addRelation('size', {
    resolver: () => SizeTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.size },
    projection: { size: true },
});
RecipeIngredientTC.addRelation('ingredient', {
    resolver: () => RecipeIngredientTC.getResolver('ingredientOrRecipe'),
    prepareArgs: { _id: (source) => source.ingredient },
    projection: { ingredient: true },
});
RecipeIngredientTC.addRelation('prepMethod', {
    resolver: () => PrepMethodTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.prepMethod },
    projection: { prepMethod: true },
});
RecipeTC.addFields({
    images: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ImageTC.getType()))),
        resolve: async (source) => {
            return await ImageTC.mongooseResolvers.findMany().resolve({
                args: { filter: { recipe: source._id } },
            });
        },
    },
});
RecipeTC.addFields({
    ratings: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RatingTC.getType()))),
        resolve: async (source) => {
            return await RatingTC.mongooseResolvers.findMany().resolve({
                args: { filter: { recipe: source._id } },
            });
        },
    },
});

export const RecipeQuery = {
    recipeById: RecipeTC.mongooseResolvers
        .findById()
        .setDescription('Get a single recipe by its ID'),
    recipeByIds: RecipeTC.mongooseResolvers
        .findByIds()
        .setDescription('Get multiple recipes by their IDs'),
    recipeOne: RecipeTC.mongooseResolvers.findOne().setDescription('Get a single recipe'),
    recipeMany: RecipeTC.mongooseResolvers
        .findMany()
        .setDescription('Get multiple recipes')
        .addSortArg({
            name: 'CREATED_DESC',
            value: { createdAt: -1 },
            description: 'Sort by creation date in descending order',
        })
        .addSortArg({
            name: 'CREATED_ASC',
            value: { createdAt: 1 },
            description: 'Sort by creation date in ascending order',
        })
        .addSortArg({
            name: 'MODIFIED_DESC',
            value: { lastModified: -1 },
            description: 'Sort by last modified date in descending order',
        })
        .addSortArg({
            name: 'MODIFIED_ASC',
            value: { lastModified: 1 },
            description: 'Sort by last modified date in ascending order',
        }),
    recipeCount: RecipeTC.mongooseResolvers.count().setDescription('Count the number of recipes'),
};

export const RecipeMutation = {
    recipeCreateOne: RecipeCreateTC.getResolver('createOne').wrapResolve((next) => (rp) => {
        rp.args.record.owner = rp.context.getUser();
        rp.args.record.titleIdentifier = generateRecipeIdentifier(rp.args.record.title);
        rp.args.record.createdAt = new Date();
        rp.args.record.lastModified = new Date();
        return next(rp);
    }),
    recipeUpdateById: RecipeModifyTC.getResolver('updateById').wrapResolve((next) => (rp) => {
        if (rp.args.record.title) {
            rp.args.record.titleIdentifier = generateRecipeIdentifier(rp.args.record.title);
        }
        rp.args.record.lastModified = new Date();
        return next(rp);
    }),
    recipeRemoveById: RecipeModifyTC.getResolver('removeById').wrapResolve((next) => async (rp) => {
        // delete all images associated with the recipe
        const images = await ImageTC.mongooseResolvers.findMany().resolve({
            args: { filter: { recipe: rp.args._id } },
        });
        await ImageTC.getResolver('imageRemoveMany').resolve({
            args: { ids: images.map((o) => o._id) },
            context: rp.context,
        });
        // delete all rating associated with the recipe
        await RatingTC.mongooseResolvers.removeMany().resolve({
            args: { filter: { recipe: rp.args._id } },
        });
        return next(rp);
    }),
};
