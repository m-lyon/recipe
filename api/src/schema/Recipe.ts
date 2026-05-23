import fs from 'fs';
import path from 'path';

import { Model } from 'mongoose';
import { schemaComposer } from 'graphql-compose';
import { GraphQLNonNull, GraphQLString } from 'graphql';
import { GraphQLError, GraphQLList, GraphQLObjectType } from 'graphql';

import { TagTC } from '../models/Tag.js';
import { SizeTC } from '../models/Size.js';
import { UnitTC } from '../models/Unit.js';
import { IMAGE_DIR } from '../constants.js';
import { ImageTC } from '../models/Image.js';
import { RatingTC } from '../models/Rating.js';
import { PrepMethodTC } from '../models/PrepMethod.js';
import { Ingredient, IngredientTC } from '../models/Ingredient.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { validateItemNotInRecipe } from '../middleware/validation.js';
import { RecipeTC, generateRecipeIdentifier } from '../models/Recipe.js';
import { Recipe, RecipeCreateTC, RecipeIngredientTC, RecipeModifyTC } from '../models/Recipe.js';

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

RecipeTC.addRelation('veganVersion', {
    resolver: () => RecipeTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source: Recipe) => source.veganVersion },
    projection: { veganVersion: true },
});

RecipeTC.addRelation('originalRecipe', {
    resolver: () => RecipeTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source: Recipe) => source.originalRecipe },
    projection: { originalRecipe: true },
});

RecipeModifyTC.addResolver({
    name: 'archiveById',
    description: 'Archive a recipe by its ID',
    type: RecipeTC.mongooseResolvers.removeById().getType(),
    args: { _id: 'MongoID!' },
    resolve: async ({ args }) => {
        const recipe = await Recipe.findById(args._id);
        if (!recipe) {
            return { recordId: recipe?._id, record: recipe };
        }
        if (recipe.originalRecipe) {
            throw new Error('Vegan copies cannot be archived directly');
        }
        await validateItemNotInRecipe(args._id, 'recipe');
        if (recipe.veganVersion) {
            await validateItemNotInRecipe(recipe.veganVersion, 'recipe');
        }

        const ids = recipe.veganVersion ? [recipe._id, recipe.veganVersion] : [recipe._id];
        await Recipe.updateMany({ _id: { $in: ids } }, { archived: true });

        const record = await Recipe.findById(args._id);
        return { recordId: record?._id, record };
    },
});

RecipeModifyTC.addResolver({
    name: 'unarchiveById',
    description: 'Unarchive a recipe by its ID',
    type: RecipeTC.mongooseResolvers.removeById().getType(),
    args: { _id: 'MongoID!' },
    resolve: async ({ args }) => {
        const recipe = await Recipe.findById(args._id);
        if (!recipe) {
            return { recordId: recipe?._id, record: recipe };
        }
        if (recipe.originalRecipe) {
            throw new Error('Vegan copies cannot be unarchived directly');
        }

        const ids = recipe.veganVersion ? [recipe._id, recipe.veganVersion] : [recipe._id];
        await Recipe.updateMany({ _id: { $in: ids } }, { archived: false });

        const record = await Recipe.findById(args._id);
        return { recordId: record?._id, record };
    },
});

RecipeModifyTC.addResolver({
    name: 'recipeCreateVeganVersion',
    type: RecipeCreateTC.getResolver('createOne').getType(),
    args: { originalId: 'MongoID!', recipe: 'CreateOneRecipeCreateInput!' },
    resolve: async ({ args, context }) => {
        const { originalId, recipe } = args;
        const user = context.getUser();
        const original = await Recipe.findById(originalId);

        if (!original) {
            throw new Error('Original recipe not found');
        }

        const isAdmin = user.role === 'admin';
        if (!isAdmin && String(original.owner) !== String(user._id)) {
            throw new Error('Not authorized to create a vegan copy for this recipe');
        }

        if (original.originalRecipe) {
            throw new Error('The original recipe cannot already be a vegan copy');
        }

        if (original.veganVersion) {
            throw new Error('Original recipe already has a vegan version');
        }

        const veganDoc = new Recipe({
            ...recipe,
            owner: original.owner,
            originalRecipe: original._id,
            titleIdentifier: generateRecipeIdentifier(recipe.title),
            createdAt: new Date(),
            lastModified: new Date(),
        });

        await veganDoc.validate();

        const updatedOriginal = await Recipe.findOneAndUpdate(
            {
                _id: original._id,
                veganVersion: { $exists: false },
            },
            {
                $set: {
                    veganVersion: veganDoc._id,
                    lastModified: new Date(),
                },
            },
            { new: true }
        );

        if (!updatedOriginal) {
            throw new Error('Original recipe already has a vegan version');
        }

        try {
            await veganDoc.save();

            const originalWithLink = await Recipe.findById(original._id);
            if (!originalWithLink) {
                throw new Error('Original recipe not found after linking vegan version');
            }
            await originalWithLink.save();
        } catch (error) {
            await Recipe.findOneAndUpdate(
                {
                    _id: original._id,
                    veganVersion: veganDoc._id,
                },
                {
                    $unset: { veganVersion: 1 },
                }
            );
            await Recipe.deleteOne({ _id: veganDoc._id, originalRecipe: original._id });
            throw error;
        }

        return { recordId: veganDoc._id, record: veganDoc };
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
        .findMany({
            filter: {
                operators: {
                    veganVersion: ['exists'],
                },
            },
        })
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
    recipeCount: RecipeTC.mongooseResolvers
        .count({
            filter: {
                operators: {
                    veganVersion: ['exists'],
                },
            },
        })
        .setDescription('Count the number of recipes'),
};

export const RecipeMutation = {
    recipeCreateOne: RecipeCreateTC.getResolver('createOne').wrapResolve((next) => async (rp) => {
        if (rp.args.record.originalRecipe) {
            throw new Error('Use recipeCreateVeganVersion to create linked vegan copies');
        }

        rp.args.record.owner = rp.context.getUser();
        rp.args.record.titleIdentifier = generateRecipeIdentifier(rp.args.record.title);
        rp.args.record.createdAt = new Date();
        rp.args.record.lastModified = new Date();
        return next(rp);
    }),
    recipeUpdateById: RecipeModifyTC.getResolver('updateById').wrapResolve((next) => async (rp) => {
        if (rp.args.record.originalRecipe || rp.args.record.veganVersion) {
            throw new Error(
                'Linked vegan relationship fields can only be changed through the dedicated vegan flow'
            );
        }

        if (rp.args.record.title) {
            // Fetch existing recipe to get the current suffix
            const existingRecipe = await Recipe.findById(rp.args._id);
            if (existingRecipe) {
                // Extract existing suffix from titleIdentifier
                const existingSuffix = existingRecipe.titleIdentifier.split('-').pop();
                rp.args.record.titleIdentifier = generateRecipeIdentifier(
                    rp.args.record.title,
                    existingSuffix
                );
            }
        }
        rp.args.record.lastModified = new Date();
        return next(rp);
    }),
    recipeRemoveById: RecipeModifyTC.getResolver('removeById')
        .wrapResolve((next) => async (rp) => {
            const result = await next(rp);
            const images = await ImageTC.mongooseResolvers.findMany().resolve({
                args: { filter: { recipe: rp.args._id } },
            });
            if (images.length > 0) {
                await ImageTC.mongooseResolvers.removeMany().resolve({
                    args: { filter: { recipe: rp.args._id } },
                });

                const errs: string[] = [];
                for (const image of images) {
                    const filepath = path.join(IMAGE_DIR, path.basename(image.origUrl));
                    try {
                        fs.unlinkSync(filepath);
                    } catch {
                        errs.push(image.origUrl);
                    }
                }

                if (errs.length > 0) {
                    console.error(`Error deleting images from disk: ${errs.join(', ')}`);
                }
            }
            // delete all rating associated with the recipe after the recipe delete succeeds
            await RatingTC.mongooseResolvers.removeMany().resolve({
                args: { filter: { recipe: rp.args._id } },
            });
            // Clean up vegan version back-references
            const record = result?.record;
            if (record?.originalRecipe) {
                // This was a vegan copy — unset veganVersion on the original
                await Recipe.findByIdAndUpdate(record.originalRecipe, {
                    $unset: { veganVersion: 1 },
                });
                // Trigger save on original so calculatedTags lose 'vegan version available'
                const original = await Recipe.findById(record.originalRecipe);
                if (original) await original.save();
            }
            if (record?.veganVersion) {
                // The original is being deleted — orphan the vegan copy
                await Recipe.findByIdAndUpdate(record.veganVersion, {
                    $unset: { originalRecipe: 1 },
                });
            }
            return result;
        })
        .wrapResolve((next) => async (rp) => {
            await validateItemNotInRecipe(rp.args._id, 'recipe');
            return next(rp);
        }),
    recipeCreateVeganVersion: RecipeModifyTC.getResolver('recipeCreateVeganVersion'),
    recipeArchiveById: RecipeModifyTC.getResolver('archiveById'),
    recipeUnarchiveById: RecipeModifyTC.getResolver('unarchiveById'),
};
