import fs from 'fs';
import path from 'path';
import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Tag } from '../../src/models/Tag.js';
import { Size } from '../../src/models/Size.js';
import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { Image } from '../../src/models/Image.js';
import { Recipe } from '../../src/models/Recipe.js';
import { Rating } from '../../src/models/Rating.js';
import { IMAGE_DIR } from '../../src/constants.js';
import { createUnits, createUser } from '../utils/data.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { RecipeMutation } from '../../src/schema/Recipe.js';
import { createRecipeTags, createUnitConversions } from '../utils/data.js';
import { createImages, createIngredients, createPrepMethods } from '../utils/data.js';
import { createAdmin, createRecipesAsIngredients, createSizes } from '../utils/data.js';

export async function createRecipeIngredientData() {
    const user = await createUser();
    await createUnits(user);
    await createSizes(user);
    await createIngredients(user);
    await createPrepMethods(user);
    await createRecipeTags();
    await createRecipesAsIngredients(user);
    await createUnitConversions();
    await createImages();
}

export function removeRecipeIngredientData(done) {
    mongoose.connection.collections.users
        .drop()
        .then(() => mongoose.connection.collections.ingredients.drop())
        .then(() => mongoose.connection.collections.units.drop())
        .then(() => mongoose.connection.collections.sizes.drop())
        .then(() => mongoose.connection.collections.prepmethods.drop())
        .then(() => {
            if (mongoose.connection.collections.tags) {
                mongoose.connection.collections.tags.drop();
            }
        })
        .then(() => {
            if (mongoose.connection.collections.recipes) {
                mongoose.connection.collections.recipes.drop();
            }
        })
        .then(() => done())
        .catch((error) => {
            console.log(error);
            assert.fail('Data not deleted');
        });
}

const getDefaultRecipeRecord = (ingredient, unit, prepMethod, tag?, size?) => {
    const record = {
        title: 'Chicken Soup',
        ingredientSubsections: [
            {
                name: 'Main',
                ingredients: [
                    {
                        ingredient: ingredient._id,
                        quantity: '500',
                        unit: unit._id,
                        size: size ? size._id : undefined,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ],
        instructionSubsections: [
            {
                name: 'Main',
                instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            },
        ],
        numServings: 4,
        tags: [],
        isIngredient: false,
    };
    if (tag) {
        record.tags = [tag._id];
    }
    return record;
};

describe('recipeCreateOne', () => {
    before(startServer);
    after(stopServer);

    beforeEach(createRecipeIngredientData);
    afterEach(removeRecipeIngredientData);

    async function createRecipe(context, user, record) {
        const query = `
        mutation RecipeCreateOne($record: CreateOneRecipeCreateInput!) {
            recipeCreateOne(record: $record) {
              record {
                _id
                title
              }
            }
          }`;
        const response = await context.apolloServer.executeOperation(
            {
                query: query,
                variables: { record },
            },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        return response;
    }

    const parseCreatedRecipe = (response) => {
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const record = (
            response.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string; title: string } };
            }
        ).recipeCreateOne.record;
        return record;
    };

    it('should create a recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        const response = await createRecipe(this, user, newRecord);
        const record = parseCreatedRecipe(response);
        assert.equal(record.title, 'Chicken Soup');
    });

    it('should create a vegan recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = {
            title: 'Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [
                {
                    name: 'Main',
                    instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
                },
            ],
            numServings: 4,
            tags: [tag._id],
            isIngredient: false,
        };
        const response = await createRecipe(this, user, newRecord);
        const record = parseCreatedRecipe(response);
        assert.equal(record.title, 'Tomato Soup');
        const doc = await Recipe.findById(record._id);
        assert.isDefined(doc.calculatedTags.includes('vegan'), 'Recipe should be vegan');
    });

    it('should create a non-vegan recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'tomato' });
        const ingredient2 = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = {
            title: 'Chicken & Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient1._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                        {
                            ingredient: ingredient2._id,
                            quantity: '200',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [
                {
                    name: 'Main',
                    instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
                },
            ],
            numServings: 4,
            tags: [tag._id],
            isIngredient: false,
        };
        const response = await createRecipe(this, user, newRecord);
        const record = parseCreatedRecipe(response);
        assert.equal(record.title, 'Chicken & Tomato Soup');
        const doc = await Recipe.findById(record._id);
        assert.isDefined(!doc.calculatedTags.includes('vegan'), 'Recipe should not be vegan');
    });

    it('should create a recipe with recipe as ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipeIngredient = await Recipe.findOne({ title: 'Bimibap' });
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        newRecord.ingredientSubsections[0].ingredients = [
            {
                ingredient: recipeIngredient._id,
                quantity: '5',
                unit: unit._id,
                size: undefined,
                prepMethod: undefined,
            },
        ];
        const response = await createRecipe(this, user, newRecord);
        const record = parseCreatedRecipe(response);
        assert.equal(record.title, 'Chicken Soup');
        const doc = await Recipe.findById(record._id);
        assert.ok(
            doc.ingredientSubsections[0].ingredients[0].ingredient._id.equals(recipeIngredient._id),
            'Recipe should be an ingredient'
        );
        assert.isDefined(
            doc.calculatedTags.includes('ingredient'),
            'Recipe should have ingredient tag'
        );
    });

    it('should NOT create a recipe, duplicate title', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod);
        await createRecipe(this, user, newRecord);
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: title: The recipe title must be unique.'
        );
    });

    it('should NOT create a recipe, tag does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        await Tag.deleteOne({ _id: tag._id });
        const deletedTag = await Tag.findById(tag._id);
        assert.isNull(deletedTag);
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: tags: The tags must be valid tags.'
        );
    });

    it('should NOT create a recipe, incorrect unit id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        unit._id = 'incorrect_id';
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const record = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        const response = await createRecipe(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: unit: Unit does not exist.'
        );
    });

    it('should NOT create a recipe, incorrect size id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const size = await Size.findOne({ value: 'small' });
        size._id = 'incorrect_id';
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const record = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag, size);
        const response = await createRecipe(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: size: Size does not exist.'
        );
    });

    it('should NOT create a recipe, incorrect ingredient id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        ingredient._id = 'incorrect_id';
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const record = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        const response = await createRecipe(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredient: Ingredient does not exist.'
        );
    });

    it('should NOT create a recipe, incorrect recipe id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Recipe.findOne({ title: 'Bimibap' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        ingredient._id = 'incorrect_id';
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const record = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        const response = await createRecipe(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredient: Ingredient does not exist.'
        );
    });

    it('should NOT create a recipe, incorrect prep method id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        prepMethod._id = 'incorrect_id';
        const tag = await Tag.findOne({ value: 'dinner' });
        const record = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        const response = await createRecipe(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: prepMethod: Prep method does not exist.'
        );
    });

    it('should NOT create a recipe, one unnamed ingredient subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'tomato' });
        const ingredient2 = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = {
            title: 'Chicken & Tomato Soup',
            ingredientSubsections: [
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: ingredient1._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
                {
                    ingredients: [
                        {
                            ingredient: ingredient1._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                        {
                            ingredient: ingredient2._id,
                            quantity: '200',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [
                {
                    name: 'Main',
                    instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
                },
            ],
            numServings: 4,
            tags: [tag._id],
            isIngredient: false,
        };
        await createRecipe(this, user, newRecord);
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredientSubsections: All ingredient subsections must be named.'
        );
    });

    it('should NOT create a recipe, no ingredients in subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        newRecord.ingredientSubsections[0].ingredients = [];
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredients: At least one ingredient is required.'
        );
    });

    it('should NOT create a recipe, no ingredient subsections', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        newRecord.ingredientSubsections = [];
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredientSubsections: At least one ingredient subsection is required.'
        );
    });

    it('should NOT create a recipe, one unnamed instruction subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = {
            ...getDefaultRecipeRecord(ingredient, unit, prepMethod, tag),
            instructionSubsections: [
                {
                    instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
                },
                {
                    name: 'Main',
                    instructions: ['Let them cool.'],
                },
            ],
        };
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: instructionSubsections: All instruction subsections must be named.'
        );
    });

    it('should NOT create a recipe, no instructions in subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        newRecord.instructionSubsections[0].instructions = [];
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: instructions: At least one instruction is required.'
        );
    });

    it('should NOT create a recipe, no instruction subsections', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag);
        newRecord.instructionSubsections = [];
        const response = await createRecipe(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: instructionSubsections: At least one instruction subsection is required.'
        );
    });

    it('should generate different suffixes for different recipes with same title', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        // Create two recipes with the same title content
        const record1 = getDefaultRecipeRecord(ingredient, unit, prepMethod);
        const record2 = getDefaultRecipeRecord(ingredient, unit, prepMethod);

        const createResponse1 = await createRecipe(this, user, record1);
        const createdRecipe1 = parseCreatedRecipe(createResponse1);

        // Modify title slightly to avoid unique constraint violation
        record2.title = 'Chicken Soup 2';
        const createResponse2 = await createRecipe(this, user, record2);
        const createdRecipe2 = parseCreatedRecipe(createResponse2);

        // Get both recipes from database
        const recipe1 = await Recipe.findById(createdRecipe1._id);
        const recipe2 = await Recipe.findById(createdRecipe2._id);

        const suffix1 = recipe1.titleIdentifier.split('-').pop();
        const suffix2 = recipe2.titleIdentifier.split('-').pop();

        assert.notEqual(suffix1, suffix2, 'Different recipes should have different suffixes');
        assert.equal(suffix1.length, 5, 'First recipe suffix should be 5 characters long');
        assert.equal(suffix2.length, 5, 'Second recipe suffix should be 5 characters long');
        assert.isTrue(
            recipe1.titleIdentifier.endsWith(`-${suffix1}`),
            'First recipe should end with its suffix'
        );
        assert.isTrue(
            recipe2.titleIdentifier.endsWith(`-${suffix2}`),
            'Second recipe should end with its suffix'
        );
    });
});

describe('recipeUpdateById', () => {
    before(startServer);
    after(stopServer);
    beforeEach(createRecipeIngredientData);
    afterEach(removeRecipeIngredientData);

    async function updateRecipe(context, user, id, record) {
        const query = `
        mutation RecipeUpdateById($id: MongoID!, $record: UpdateByIdRecipeModifyInput!) {
            recipeUpdateById(_id: $id,record: $record) {
              record {
                _id
                title
              }
            }
          }`;
        const response = await context.apolloServer.executeOperation(
            { query: query, variables: { id, record } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        return response;
    }

    async function updateRecipeResolverDirectly(user, id, record) {
        return RecipeMutation.recipeUpdateById.resolve({
            args: { _id: id, record },
            context: {
                isAuthenticated: () => true,
                getUser: () => user,
            },
        });
    }

    const getDefaultRecipe = (owner, ingredient, unit, prepMethod, tag?, size?) => {
        const record = getDefaultRecipeRecord(ingredient, unit, prepMethod, tag, size);
        return {
            ...record,
            titleIdentifier: record.title.toLowerCase(),
            owner: owner._id,
            createdAt: new Date(),
            lastModified: new Date(),
        };
    };

    const parseUpdatedRecipe = (response) => {
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const record = (
            response.body.singleResult.data as {
                recipeUpdateById: { record: { _id: string; title: string } };
            }
        ).recipeUpdateById.record;
        return record;
    };

    it('should update a recipe notes', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            notes: 'This is a fab recipe',
        });
        const record = parseUpdatedRecipe(response);
        assert.equal(record.title, 'Chicken Soup');
    });

    it('should update a recipe to be vegan', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'chicken' });
        const ingredient2 = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient1, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: ingredient2._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        const record = parseUpdatedRecipe(response);
        const doc = await Recipe.findById(record._id);
        assert(doc.calculatedTags.includes('vegan'), 'Recipe should be vegan');
    });

    it('should update a recipe to not be vegan', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'tomato' });
        const ingredient2 = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient1, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: ingredient2._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        const record = parseUpdatedRecipe(response);
        const doc = await Recipe.findById(record._id);
        assert(!doc.calculatedTags.includes('vegan'), 'Recipe should not be vegan');
    });

    it('should update a recipe title and titleIdentifier', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, { title: 'Chicken broth' });
        const record = parseUpdatedRecipe(response);
        assert.equal(record.title, 'Chicken broth');
        const updatedRecipe = await Recipe.findById(recipe._id);
        assert.notEqual(updatedRecipe.titleIdentifier, 'chicken-soup');
    });

    it('should update a recipe to be an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient1, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            isIngredient: true,
            pluralTitle: 'Tomato Soup',
        });
        const record = parseUpdatedRecipe(response);
        const doc = await Recipe.findById(record._id);
        assert.isTrue(doc.isIngredient, 'Recipe should be an ingredient');
        assert.equal(doc.pluralTitle, 'Tomato Soup');
        assert.isDefined(
            doc.calculatedTags.includes('ingredient'),
            'Recipe should have ingredient tag'
        );
    });

    it('should update a recipe to have recipe as ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'chicken' });
        const recipeIngredient = await Recipe.findOne({ title: 'Bimibap' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient1, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: recipeIngredient._id,
                            quantity: '300',
                            unit: unit._id,
                        },
                    ],
                },
            ],
        });
        const record = parseUpdatedRecipe(response);
        const doc = await Recipe.findById(record._id);
        assert.ok(
            doc.ingredientSubsections[0].ingredients[0].ingredient._id.equals(recipeIngredient._id),
            'Recipe should be an ingredient'
        );
    });

    it('should NOT allow recipeUpdateById to set vegan relationship fields directly', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const original = await new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod)).save();
        const vegan = await new Recipe({
            ...getDefaultRecipe(user, ingredient, unit, prepMethod),
            title: 'Tomato Soup Vegan',
            titleIdentifier: 'tomato-soup-vegan',
        }).save();

        const response = await updateRecipe(this, user, original._id, {
            veganVersion: vegan._id,
        });

        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Field "veganVersion" is not defined by type "UpdateByIdRecipeModifyInput"'
        );

        const unchangedOriginal = await Recipe.findById(original._id);
        assert.isUndefined(unchangedOriginal.veganVersion);
    });

    it('should reject direct resolver writes to vegan relationship fields outside the dedicated flow', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const original = await new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod)).save();
        const vegan = await new Recipe({
            ...getDefaultRecipe(user, ingredient, unit, prepMethod),
            title: 'Tomato Soup Vegan',
            titleIdentifier: 'tomato-soup-vegan-direct',
        }).save();

        try {
            await updateRecipeResolverDirectly(user, original._id, {
                veganVersion: vegan._id,
            });
            assert.fail('Expected direct resolver write to be rejected');
        } catch (error) {
            assert.instanceOf(error, Error);
            assert.include(
                (error as Error).message,
                'Linked vegan relationship fields can only be changed through the dedicated vegan flow'
            );
        }

        const unchangedOriginal = await Recipe.findById(original._id);
        assert.isUndefined(unchangedOriginal.veganVersion);
    });

    it('should NOT update a recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const recipeOne = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod));
        const recipe = await recipeOne.save();
        const recipeTwo = new Recipe({
            ...getDefaultRecipe(user, ingredient, unit, prepMethod),
            title: 'Chicken Broth',
            titleIdentifier: 'chicken-broth',
            numServings: 2,
        });
        await recipeTwo.save();
        const response = await updateRecipe(this, user, recipe._id, { title: 'Chicken Broth' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: title: The recipe title must be unique.'
        );
    });

    it('should NOT update a recipe, tag does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        await Tag.deleteOne({ _id: tag._id });
        const deletedTag = await Tag.findById(tag._id);
        assert.isNull(deletedTag);
        const response = await updateRecipe(this, user, recipe._id, { tags: [tag._id] });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: tags: The tags must be valid tags.'
        );
    });

    it('should NOT update a recipe, incorrect unit id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        unit._id = 'incorrect_id';
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: unit: Unit does not exist.'
        );
    });

    it('should NOT update a recipe, incorrect size id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const size = await Size.findOne({ value: 'small' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag, size));
        await recipe.save();
        size._id = 'incorrect_id';
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient._id,
                            quantity: '300',
                            unit: unit._id,
                            size: size._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: size: Size does not exist.'
        );
    });

    it('should NOT update a recipe, incorrect ingredient id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        ingredient._id = 'incorrect_id';
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredient: Ingredient does not exist.'
        );
    });

    it('should NOT update a recipe, incorrect recipe id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Recipe.findOne({ title: 'Bimibap' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        ingredient._id = 'incorrect_id';
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredient: Ingredient does not exist.'
        );
    });

    it('should NOT update a recipe, incorrect prep method id in recipe ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        prepMethod._id = 'incorrect_id';
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: prepMethod: Prep method does not exist.'
        );
    });

    it('should NOT update a recipe, one unnamed subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'tomato' });
        const ingredient2 = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient1, unit, prepMethod, tag));
        await recipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient1._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: ingredient2._id,
                            quantity: '200',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredientSubsections: All ingredient subsections must be named.'
        );
    });

    it('should NOT update a recipe, no ingredients in subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredients: At least one ingredient is required.'
        );
    });

    it('should NOT update a recipe, no subsections', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        const response = await updateRecipe(this, user, recipe._id, { ingredientSubsections: [] });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredientSubsections: At least one ingredient subsection is required.'
        );
    });

    it('should NOT update a recipe, one unnamed instruction subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            instructionSubsections: [
                {
                    instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
                },
                {
                    name: 'Main',
                    instructions: ['Let them cool.'],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: instructionSubsections: All instruction subsections must be named.'
        );
    });

    it('should NOT update a recipe, no instructions in subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            instructionSubsections: [
                {
                    name: 'Main',
                    instructions: [],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: instructions: At least one instruction is required.'
        );
    });

    // URL Suffix preservation tests
    it('should preserve the random suffix when updating a recipe title', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        // Create a recipe
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod));
        const recipe = await newRecipe.save();

        // Get the original suffix
        const originalSuffix = recipe.titleIdentifier.split('-').pop();

        // Update the recipe title
        const response = await updateRecipe(this, user, recipe._id, {
            title: 'Updated Chicken Soup',
        });
        const updatedRecord = parseUpdatedRecipe(response);

        // Verify the updated recipe
        const updatedRecipe = await Recipe.findById(updatedRecord._id);
        const updatedSuffix = updatedRecipe.titleIdentifier.split('-').pop();

        assert.equal(originalSuffix, updatedSuffix, 'URL suffix should remain the same');
        assert.equal(updatedRecipe.title, 'Updated Chicken Soup');
        assert.isTrue(
            updatedRecipe.titleIdentifier.startsWith('updated-chicken-soup-'),
            'Title identifier should reflect new title but keep original suffix'
        );
    });

    it('should preserve the random suffix when updating multiple times', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        // Create a recipe
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod));
        const recipe = await newRecipe.save();

        // Get the original suffix
        const originalSuffix = recipe.titleIdentifier.split('-').pop();

        // Update the recipe title multiple times
        await updateRecipe(this, user, recipe._id, {
            title: 'First Update',
        });

        await updateRecipe(this, user, recipe._id, {
            title: 'Second Update',
        });

        const finalUpdateResponse = await updateRecipe(this, user, recipe._id, {
            title: 'Final Update',
        });
        const finalRecord = parseUpdatedRecipe(finalUpdateResponse);

        // Verify the final recipe
        const finalRecipe = await Recipe.findById(finalRecord._id);
        const finalSuffix = finalRecipe.titleIdentifier.split('-').pop();

        assert.equal(
            originalSuffix,
            finalSuffix,
            'URL suffix should remain the same after multiple updates'
        );
        assert.equal(finalRecipe.title, 'Final Update');
        assert.isTrue(
            finalRecipe.titleIdentifier.startsWith('final-update-'),
            'Title identifier should reflect final title but keep original suffix'
        );
    });

    it('should not change suffix when updating non-title fields', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        // Create a recipe
        const newRecipe = new Recipe(getDefaultRecipe(user, ingredient, unit, prepMethod));
        const recipe = await newRecipe.save();

        // Get the original identifier
        const originalTitleIdentifier = recipe.titleIdentifier;

        // Update non-title fields
        await updateRecipe(this, user, recipe._id, {
            numServings: 6,
            notes: 'Updated notes',
        });

        // Verify the recipe
        const updatedRecipe = await Recipe.findById(recipe._id);

        assert.equal(
            originalTitleIdentifier,
            updatedRecipe.titleIdentifier,
            'Title identifier should not change when updating non-title fields'
        );
        assert.equal(updatedRecipe.numServings, 6);
        assert.equal(updatedRecipe.notes, 'Updated notes');
    });
});

describe('recipeArchiveById', () => {
    before(startServer);
    after(stopServer);
    beforeEach(createRecipeIngredientData);
    afterEach(removeRecipeIngredientData);

    async function archiveRecipe(context, user, id) {
        const query = `
        mutation RecipeArchiveById($id: MongoID!) {
            recipeArchiveById(_id: $id) {
              recordId
              record {
                _id
                title
                archived
              }
            }
          }`;
        const response = await context.apolloServer.executeOperation(
            { query: query, variables: { id } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        return response;
    }

    async function unarchiveRecipe(context, user, id) {
        const query = `
        mutation RecipeUnarchiveById($id: MongoID!) {
            recipeUnarchiveById(_id: $id) {
              recordId
              record {
                _id
                title
                archived
              }
            }
          }`;
        const response = await context.apolloServer.executeOperation(
            { query: query, variables: { id } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        return response;
    }

    async function createLinkedOriginalAndVegan(
        user,
        options: { archived: boolean }
    ): Promise<{ original: typeof Recipe.prototype; vegan: typeof Recipe.prototype }> {
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const original = await Recipe.create({
            title: 'Tomato Soup',
            titleIdentifier: 'tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: options.archived,
        });
        const vegan = await Recipe.create({
            title: 'Vegan Tomato Soup',
            titleIdentifier: 'vegan-tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: options.archived,
            originalRecipe: original._id,
        });
        original.veganVersion = vegan._id;
        await original.save();

        return { original, vegan };
    }

    it('should archive a recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Bimibap' });
        assert.isFalse(recipe.archived, 'Recipe should not be archived initially');

        const response = await archiveRecipe(this, user, recipe._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const data = response.body.singleResult.data as {
            recipeArchiveById: {
                recordId: string;
                record: { _id: string; title: string; archived: boolean };
            };
        };
        assert.equal(data.recipeArchiveById.recordId, recipe._id.toString());
        assert.isTrue(data.recipeArchiveById.record.archived, 'Record should be archived');

        // Verify in DB
        const archivedRecipe = await Recipe.findById(recipe._id);
        assert.isNotNull(archivedRecipe, 'Recipe should still exist (not deleted)');
        assert.isTrue(archivedRecipe.archived, 'Recipe should be archived in the database');
    });

    it('should archive an original recipe and its vegan version', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const { original, vegan } = await createLinkedOriginalAndVegan(user, { archived: false });

        const response = await archiveRecipe(this, user, original._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const data = response.body.singleResult.data as {
            recipeArchiveById: {
                recordId: string;
                record: { _id: string; title: string; archived: boolean };
            };
        };
        assert.equal(data.recipeArchiveById.recordId, original._id.toString());
        assert.isTrue(data.recipeArchiveById.record.archived, 'Returned record should be archived');

        const [archivedOriginal, archivedVegan] = await Promise.all([
            Recipe.findById(original._id),
            Recipe.findById(vegan._id),
        ]);
        assert.isTrue(archivedOriginal.archived, 'Original recipe should be archived');
        assert.isTrue(archivedVegan.archived, 'Linked vegan version should be archived');
    });

    it('should NOT allow archiving a vegan copy directly', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const { vegan } = await createLinkedOriginalAndVegan(user, { archived: false });

        const response = await archiveRecipe(this, user, vegan._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Vegan copies cannot be archived directly'
        );
    });

    it('should NOT archive a recipe that is used as an ingredient in another recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipeIngredient = await Recipe.findOne({ title: 'Bimibap' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe({
            ...getDefaultRecipeRecord(ingredient, unit, prepMethod),
            owner: user._id,
            titleIdentifier: 'chicken-soup',
            createdAt: new Date(),
            lastModified: new Date(),
            ingredientSubsections: [
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: recipeIngredient._id,
                            quantity: '300',
                            unit: unit._id,
                        },
                    ],
                },
            ],
        });
        await newRecipe.save();

        const response = await archiveRecipe(this, user, recipeIngredient._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Error should be returned');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete recipe as it is currently being used in other existing recipes.'
        );

        // Verify recipe is NOT archived
        const existingRecipe = await Recipe.findById(recipeIngredient._id);
        assert.isNotNull(existingRecipe, 'Recipe should still exist');
        assert.isFalse(existingRecipe.archived, 'Recipe should not be archived');
    });

    it('should NOT archive an original recipe if its linked vegan version is used as an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const { original, vegan } = await createLinkedOriginalAndVegan(user, { archived: false });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const recipeUsingVegan = new Recipe({
            ...getDefaultRecipeRecord(ingredient, unit, prepMethod),
            owner: user._id,
            titleIdentifier: 'chicken-soup-using-vegan',
            createdAt: new Date(),
            lastModified: new Date(),
            ingredientSubsections: [
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: vegan._id,
                            quantity: '300',
                            unit: unit._id,
                        },
                    ],
                },
            ],
        });
        await recipeUsingVegan.save();

        const response = await archiveRecipe(this, user, original._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Error should be returned');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete recipe as it is currently being used in other existing recipes.'
        );

        const [existingOriginal, existingVegan] = await Promise.all([
            Recipe.findById(original._id),
            Recipe.findById(vegan._id),
        ]);
        assert.isFalse(existingOriginal.archived, 'Original recipe should not be archived');
        assert.isFalse(existingVegan.archived, 'Linked vegan version should not be archived');
    });

    it('should unarchive a recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Bimibap' });

        // First archive the recipe directly in the DB
        await Recipe.findByIdAndUpdate(recipe._id, { archived: true });
        const archivedRecipe = await Recipe.findById(recipe._id);
        assert.isTrue(archivedRecipe.archived, 'Recipe should be archived before unarchiving');

        const response = await unarchiveRecipe(this, user, recipe._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const data = response.body.singleResult.data as {
            recipeUnarchiveById: {
                recordId: string;
                record: { _id: string; title: string; archived: boolean };
            };
        };
        assert.equal(data.recipeUnarchiveById.recordId, recipe._id.toString());
        assert.isFalse(data.recipeUnarchiveById.record.archived, 'Record should not be archived');

        // Verify in DB
        const unarchivedRecipe = await Recipe.findById(recipe._id);
        assert.isFalse(unarchivedRecipe.archived, 'Recipe should be unarchived in the database');
    });

    it('should unarchive an original recipe and its vegan version', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const { original, vegan } = await createLinkedOriginalAndVegan(user, { archived: true });

        const response = await unarchiveRecipe(this, user, original._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const data = response.body.singleResult.data as {
            recipeUnarchiveById: {
                recordId: string;
                record: { _id: string; title: string; archived: boolean };
            };
        };
        assert.equal(data.recipeUnarchiveById.recordId, original._id.toString());
        assert.isFalse(
            data.recipeUnarchiveById.record.archived,
            'Returned record should not be archived'
        );

        const [unarchivedOriginal, unarchivedVegan] = await Promise.all([
            Recipe.findById(original._id),
            Recipe.findById(vegan._id),
        ]);
        assert.isFalse(unarchivedOriginal.archived, 'Original recipe should be unarchived');
        assert.isFalse(unarchivedVegan.archived, 'Linked vegan version should be unarchived');
    });

    it('should NOT allow unarchiving a vegan copy directly', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const { vegan } = await createLinkedOriginalAndVegan(user, { archived: false });
        await Recipe.findByIdAndUpdate(vegan._id, { archived: true });

        const response = await unarchiveRecipe(this, user, vegan._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Vegan copies cannot be unarchived directly'
        );
    });

    it('should filter archived recipes from recipeMany by default', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Bimibap' });

        // Archive the recipe
        await Recipe.findByIdAndUpdate(recipe._id, { archived: true });

        // Query with archived: false filter
        const queryNotArchived = `
        query RecipeMany($filter: FilterFindManyRecipeInput) {
            recipeMany(filter: $filter) {
                _id
                title
                archived
            }
        }`;
        const responseNotArchived = await this.apolloServer.executeOperation(
            { query: queryNotArchived, variables: { filter: { archived: false } } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        assert.equal(responseNotArchived.body.kind, 'single');
        assert.isUndefined(responseNotArchived.body.singleResult.errors);
        const recipes = (
            responseNotArchived.body.singleResult.data as {
                recipeMany: Array<{ _id: string; title: string; archived: boolean }>;
            }
        ).recipeMany;
        const archivedInList = recipes.find((r) => r._id === recipe._id.toString());
        assert.isUndefined(
            archivedInList,
            'Archived recipe should not appear in non-archived results'
        );

        // Query with archived: true filter
        const queryArchived = `
        query RecipeMany($filter: FilterFindManyRecipeInput) {
            recipeMany(filter: $filter) {
                _id
                title
                archived
            }
        }`;
        const responseArchived = await this.apolloServer.executeOperation(
            { query: queryArchived, variables: { filter: { archived: true } } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        assert.equal(responseArchived.body.kind, 'single');
        assert.isUndefined(responseArchived.body.singleResult.errors);
        const archivedRecipes = (
            responseArchived.body.singleResult.data as {
                recipeMany: Array<{ _id: string; title: string; archived: boolean }>;
            }
        ).recipeMany;
        const foundArchived = archivedRecipes.find((r) => r._id === recipe._id.toString());
        assert.isDefined(foundArchived, 'Archived recipe should appear in archived results');
        assert.isTrue(foundArchived.archived);
    });

    it('should filter archived recipes from recipeCount', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Bimibap' });

        // Get initial count of non-archived recipes
        const countQuery = `
        query RecipeCount($filter: FilterCountRecipeInput) {
            recipeCount(filter: $filter)
        }`;
        const initialResponse = await this.apolloServer.executeOperation(
            { query: countQuery, variables: { filter: { archived: false } } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        assert.equal(initialResponse.body.kind, 'single');
        const initialCount = (
            initialResponse.body.singleResult.data as {
                recipeCount: number;
            }
        ).recipeCount;

        // Archive the recipe
        await Recipe.findByIdAndUpdate(recipe._id, { archived: true });

        // Get count again
        const afterResponse = await this.apolloServer.executeOperation(
            { query: countQuery, variables: { filter: { archived: false } } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        assert.equal(afterResponse.body.kind, 'single');
        const afterCount = (
            afterResponse.body.singleResult.data as {
                recipeCount: number;
            }
        ).recipeCount;

        assert.equal(afterCount, initialCount - 1, 'Count should decrease by 1 after archiving');
    });

    it('should expose recipeRemoveById mutation for recipe owners', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const recipe = await Recipe.create({
            ...getDefaultRecipeRecord(ingredient, unit, prepMethod),
            owner: user._id,
            titleIdentifier: 'temporary-recipe',
            createdAt: new Date(),
            lastModified: new Date(),
        });
        const query = `
        mutation RecipeRemoveById($id: MongoID!) {
            recipeRemoveById(_id: $id) {
              recordId
            }
          }`;
        const response = await this.apolloServer.executeOperation(
            { query: query, variables: { id: recipe._id } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const data = response.body.singleResult.data as {
            recipeRemoveById: { recordId: string };
        };
        assert.equal(data.recipeRemoveById.recordId, recipe._id.toString());
    });
});

describe('recipeRemoveById', () => {
    before(startServer);
    after(stopServer);
    beforeEach(createRecipeIngredientData);
    afterEach(removeRecipeIngredientData);

    async function removeRecipe(context, user, id) {
        const query = `
        mutation RecipeRemoveById($id: MongoID!) {
            recipeRemoveById(_id: $id) {
                recordId
            }
        }`;
        return context.apolloServer.executeOperation(
            { query, variables: { id } },
            { contextValue: { isAuthenticated: () => true, getUser: () => user } }
        );
    }

    async function createLinkedOriginalAndVegan(user) {
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const original = await Recipe.create({
            title: 'Tomato Soup',
            titleIdentifier: 'tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
        });
        const vegan = await Recipe.create({
            title: 'Vegan Tomato Soup',
            titleIdentifier: 'vegan-tomato-soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
            originalRecipe: original._id,
        });
        original.veganVersion = vegan._id;
        await original.save();

        return { original, vegan };
    }

    it('should delete a vegan version and clear veganVersion on the original recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const { original, vegan } = await createLinkedOriginalAndVegan(user);

        const linkedOriginal = await Recipe.findById(original._id);
        assert.include(
            linkedOriginal.calculatedTags,
            'vegan version available',
            'Original recipe should gain vegan version available calculated tag when linked'
        );

        const response = await removeRecipe(this, user, vegan._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const data = response.body.singleResult.data as {
            recipeRemoveById: { recordId: string };
        };
        assert.equal(data.recipeRemoveById.recordId, vegan._id.toString());

        const [deletedVegan, updatedOriginal] = await Promise.all([
            Recipe.findById(vegan._id),
            Recipe.findById(original._id),
        ]);
        assert.isNull(deletedVegan, 'Vegan version should be deleted');
        assert.isUndefined(
            updatedOriginal.veganVersion,
            'Original recipe should lose the deleted veganVersion reference'
        );
        assert.notInclude(
            updatedOriginal.calculatedTags,
            'vegan version available',
            'Original recipe should lose vegan version available calculated tag'
        );
    });

    it('should NOT allow a non-owner to remove a recipe', async function () {
        const owner = await User.findOne({ username: 'testuser1' });
        const nonOwner = await User.register(
            new User({
                username: 'testuser3',
                firstName: 'Tester3',
                lastName: 'McTestFace',
                role: 'user',
            }),
            'password'
        );
        const recipe = await Recipe.findOne({ title: 'Bimibap' });

        const response = await removeRecipe(this, nonOwner, recipe._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(response.body.singleResult.errors[0].message, 'You are not authorised!');

        const existingRecipe = await Recipe.findById(recipe._id);
        assert.isNotNull(existingRecipe, 'Recipe should not be deleted by a non-owner');
    });

    it('should delete an original recipe and clear originalRecipe on its vegan version', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const { original, vegan } = await createLinkedOriginalAndVegan(user);

        const response = await removeRecipe(this, user, original._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const data = response.body.singleResult.data as {
            recipeRemoveById: { recordId: string };
        };
        assert.equal(data.recipeRemoveById.recordId, original._id.toString());

        const [deletedOriginal, updatedVegan] = await Promise.all([
            Recipe.findById(original._id),
            Recipe.findById(vegan._id),
        ]);
        assert.isNull(deletedOriginal, 'Original recipe should be deleted');
        assert.isUndefined(
            updatedVegan.originalRecipe,
            'Vegan version should lose the deleted originalRecipe reference'
        );
    });

    it('should NOT remove linked data before recipe deletion succeeds', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const recipe = await Recipe.create({
            title: 'Delete Ordering Tomato Soup',
            titleIdentifier: 'delete-ordering-tomato-soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
        });

        const rating = await new Rating({
            recipe: recipe._id,
            owner: user._id,
            value: 4,
        }).save();

        const originalDeleteOne = Recipe.prototype.deleteOne;
        Recipe.prototype.deleteOne = async function (...args) {
            if (this._id.toString() === recipe._id.toString()) {
                throw new Error('Simulated recipe delete failure');
            }
            return originalDeleteOne.apply(this, args);
        };

        try {
            const response = await removeRecipe(this, user, recipe._id);
            assert.equal(response.body.kind, 'single');
            assert.isDefined(response.body.singleResult.errors, 'Should have errors');
            assert.include(
                response.body.singleResult.errors[0].message,
                'Simulated recipe delete failure'
            );
        } finally {
            Recipe.prototype.deleteOne = originalDeleteOne;
        }

        const [remainingRecipe, remainingRating] = await Promise.all([
            Recipe.findById(recipe._id),
            Rating.findById(rating._id),
        ]);

        assert.isNotNull(remainingRecipe, 'Recipe should remain when deletion fails');
        assert.isNotNull(remainingRating, 'Ratings should remain when deletion fails');
    });

    it('should delete a recipe with attached images', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const recipe = await Recipe.create({
            title: 'Delete Image Tomato Soup',
            titleIdentifier: 'delete-image-tomato-soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: user._id,
            createdAt: new Date(),
            lastModified: new Date(),
            archived: false,
        });

        const image = await new Image({
            recipe: recipe._id,
            origUrl: 'uploads/images/recipe1_image1.jpeg',
        }).save();
        const originalUnlinkSync = fs.unlinkSync;
        fs.unlinkSync = () => undefined as never;

        try {
            const response = await removeRecipe(this, user, recipe._id);
            assert.equal(response.body.kind, 'single');
            assert.isUndefined(
                response.body.singleResult.errors,
                response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
            );

            const [deletedRecipe, deletedImage] = await Promise.all([
                Recipe.findById(recipe._id),
                Image.findById(image._id),
            ]);

            assert.isNull(deletedRecipe, 'Recipe should be deleted');
            assert.isNull(deletedImage, 'Image should be deleted');
        } finally {
            fs.unlinkSync = originalUnlinkSync;
        }
    });
});

describe('recipeCreateOne vegan validation', () => {
    before(startServer);
    after(stopServer);
    beforeEach(createRecipeIngredientData);
    afterEach(removeRecipeIngredientData);

    async function createRecipe(context, user, record) {
        const query = `
        mutation RecipeCreateOne($record: CreateOneRecipeCreateInput!) {
            recipeCreateOne(record: $record) {
              record {
                _id
                title
              }
            }
          }`;
        return context.apolloServer.executeOperation(
            { query, variables: { record } },
            { contextValue: { isAuthenticated: () => true, getUser: () => user } }
        );
    }

    async function createVeganCopy(context, user, originalId: string, recipe) {
        const query = `
        mutation CreateVeganCopy($originalId: MongoID!, $recipe: CreateOneRecipeCreateInput!) {
            recipeCreateVeganVersion(originalId: $originalId, recipe: $recipe) {
                record {
                    _id
                    title
                }
            }
        }`;
        return context.apolloServer.executeOperation(
            { query, variables: { originalId, recipe } },
            { contextValue: { isAuthenticated: () => true, getUser: () => user } }
        );
    }

    it('should NOT create a vegan copy with recipeCreateVeganVersion if not all ingredients are vegan', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const chicken = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        // First create the original recipe (non-vegan)
        const originalResponse = await createRecipe(this, user, {
            title: 'Chicken Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: chicken._id,
                            quantity: '500',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const response = await createVeganCopy(this, user, originalId, {
            title: 'Vegan Chicken Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: chicken._id,
                            quantity: '500',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Vegan recipe must have all vegan ingredients'
        );

        const count = await Recipe.countDocuments({ title: 'Vegan Chicken Soup' });
        assert.equal(count, 0, 'No vegan chicken soup recipe should be created');
    });

    it('should allow a vegan copy to have the same title as the original recipe via recipeCreateVeganVersion', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        // Create the original recipe
        const originalResponse = await createRecipe(this, user, {
            title: 'Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const veganResponse = await createVeganCopy(this, user, originalId, {
            title: 'Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.equal(veganResponse.body.kind, 'single');
        assert.isUndefined(
            veganResponse.body.singleResult.errors,
            veganResponse.body.singleResult.errors
                ? veganResponse.body.singleResult.errors[0].message
                : ''
        );
        const veganRecord = (
            veganResponse.body.singleResult.data as {
                recipeCreateVeganVersion: { record: { _id: string; title: string } };
            }
        ).recipeCreateVeganVersion.record;
        assert.equal(veganRecord.title, 'Tomato Soup');
    });

    it('should NOT allow recipeCreateOne to create a linked vegan copy with originalRecipe set', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const originalResponse = await createRecipe(this, user, {
            title: 'Direct Linked Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const response = await createRecipe(this, user, {
            title: 'Direct Linked Tomato Soup',
            originalRecipe: originalId,
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Field "originalRecipe" is not defined by type "CreateOneRecipeCreateInput"'
        );

        const copies = await Recipe.find({
            title: 'Direct Linked Tomato Soup',
            originalRecipe: { $exists: true },
        });
        assert.lengthOf(copies, 0);
    });

    it('should allow re-saving an original recipe after linking a same-title vegan copy', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const originalResponse = await createRecipe(this, user, {
            title: 'Resave Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            originalResponse.body.singleResult.errors,
            originalResponse.body.singleResult.errors
                ? originalResponse.body.singleResult.errors[0].message
                : ''
        );
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const veganResponse = await createVeganCopy(this, user, originalId, {
            title: 'Resave Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            veganResponse.body.singleResult.errors,
            veganResponse.body.singleResult.errors
                ? veganResponse.body.singleResult.errors[0].message
                : ''
        );
        const veganId = (
            veganResponse.body.singleResult.data as {
                recipeCreateVeganVersion: { record: { _id: string } };
            }
        ).recipeCreateVeganVersion.record._id;

        const originalDoc = await Recipe.findById(originalId);
        originalDoc.notes = 'Updated after linking vegan copy';
        await originalDoc.save();

        const updatedOriginal = await Recipe.findById(originalId);
        assert.equal(updatedOriginal.notes, 'Updated after linking vegan copy');
    });

    it('should NOT allow an original recipe to be renamed to its linked vegan copy title when they differ', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const originalResponse = await createRecipe(this, user, {
            title: 'Original Rename Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            originalResponse.body.singleResult.errors,
            originalResponse.body.singleResult.errors
                ? originalResponse.body.singleResult.errors[0].message
                : ''
        );
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const veganResponse = await createVeganCopy(this, user, originalId, {
            title: 'Vegan Rename Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            veganResponse.body.singleResult.errors,
            veganResponse.body.singleResult.errors
                ? veganResponse.body.singleResult.errors[0].message
                : ''
        );
        const veganId = (
            veganResponse.body.singleResult.data as {
                recipeCreateVeganVersion: { record: { _id: string } };
            }
        ).recipeCreateVeganVersion.record._id;

        const originalDoc = await Recipe.findById(originalId);
        originalDoc.title = 'Vegan Rename Soup';

        try {
            await originalDoc.save();
            assert.fail('Expected title uniqueness validation to reject renaming to linked vegan title');
        } catch (error) {
            assert.match(error.message, /title must be unique/i);
        }
    });

    it('should NOT allow a vegan copy to duplicate an unrelated recipe title', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const originalResponse = await createRecipe(this, user, {
            title: 'Original Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        await createRecipe(this, user, {
            title: 'Existing Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        const veganResponse = await createVeganCopy(this, user, originalId, {
            title: 'Existing Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(veganResponse.body.kind, 'single');
        assert.isDefined(veganResponse.body.singleResult.errors);
        assert.match(
            veganResponse.body.singleResult.errors[0].message,
            /Recipe title must be unique/i
        );
    });

    it('should NOT allow a vegan copy to duplicate the title of an unrelated existing vegan copy', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const firstOriginalResponse = await createRecipe(this, user, {
            title: 'First Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const firstOriginalId = (
            firstOriginalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const existingVeganResponse = await createVeganCopy(this, user, firstOriginalId, {
            title: 'Shared Vegan Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            existingVeganResponse.body.singleResult.errors,
            existingVeganResponse.body.singleResult.errors
                ? existingVeganResponse.body.singleResult.errors[0].message
                : ''
        );

        const secondOriginalResponse = await createRecipe(this, user, {
            title: 'Second Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const secondOriginalId = (
            secondOriginalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const duplicateVeganResponse = await createVeganCopy(this, user, secondOriginalId, {
            title: 'Shared Vegan Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(duplicateVeganResponse.body.kind, 'single');
        assert.isDefined(duplicateVeganResponse.body.singleResult.errors);
        assert.match(
            duplicateVeganResponse.body.singleResult.errors[0].message,
            /Recipe title must be unique/i
        );
    });

    it('should NOT allow a vegan copy to use an out-of-scope original to bypass title uniqueness', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const otherUser = await User.register(
            new User({
                username: 'testuser3',
                firstName: 'Tester3',
                lastName: 'McTestFace',
                role: 'user',
            }),
            'password'
        );
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        await createRecipe(this, user, {
            title: 'Scoped Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        const outOfScopeOriginalResponse = await createRecipe(this, otherUser, {
            title: 'Scoped Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const outOfScopeOriginalId = (
            outOfScopeOriginalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const veganResponse = await createVeganCopy(this, user, outOfScopeOriginalId, {
            title: 'Scoped Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(veganResponse.body.kind, 'single');
        assert.isDefined(veganResponse.body.singleResult.errors);
        assert.match(
            veganResponse.body.singleResult.errors[0].message,
            /Not authorized to create a vegan copy for this recipe/i
        );
    });

    it('should allow creating a vegan copy with recipeCreateVeganVersion (real UI flow)', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        // Step 1: Create original recipe
        const originalResponse = await createRecipe(this, user, {
            title: 'Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            originalResponse.body.singleResult.errors,
            originalResponse.body.singleResult.errors
                ? `Step 1 failed: ${originalResponse.body.singleResult.errors[0].message}`
                : ''
        );
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const veganResponse = await createVeganCopy(this, user, originalId, {
            title: 'Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.equal(veganResponse.body.kind, 'single');
        assert.isUndefined(
            veganResponse.body.singleResult.errors,
            veganResponse.body.singleResult.errors
                ? veganResponse.body.singleResult.errors[0].message
                : ''
        );
        const veganId = (
            veganResponse.body.singleResult.data as {
                recipeCreateVeganVersion: { record: { _id: string } };
            }
        ).recipeCreateVeganVersion.record._id;

        const [original, vegan] = await Promise.all([
            Recipe.findById(originalId),
            Recipe.findById(veganId),
        ]);
        assert.equal(String(original.veganVersion), veganId);
        assert.equal(String(vegan.originalRecipe), originalId);
    });

    it('should NOT expose the obsolete recipeLinkVeganVersion mutation', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const response = await this.apolloServer.executeOperation(
            {
                query: `
                mutation LinkVegan($originalId: MongoID!, $veganId: MongoID!) {
                    recipeLinkVeganVersion(originalId: $originalId, veganId: $veganId)
                }`,
                variables: {
                    originalId: new mongoose.Types.ObjectId().toString(),
                    veganId: new mongoose.Types.ObjectId().toString(),
                },
            },
            { contextValue: { isAuthenticated: () => true, getUser: () => user } }
        );

        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Cannot query field "recipeLinkVeganVersion" on type "Mutation"'
        );
    });

    it('should create and link a vegan copy atomically', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const originalResponse = await createRecipe(this, user, {
            title: 'Atomic Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const response = await createVeganCopy(this, user, originalId, {
            title: 'Atomic Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );
        const veganId = (
            response.body.singleResult.data as {
                recipeCreateVeganVersion: { record: { _id: string; title: string } };
            }
        ).recipeCreateVeganVersion.record._id;

        const [originalDoc, veganDoc] = await Promise.all([
            Recipe.findById(originalId),
            Recipe.findById(veganId),
        ]);
        assert.equal(String(originalDoc.veganVersion), String(veganId));
        assert.equal(String(veganDoc.originalRecipe), String(originalId));

        const updatedOriginal = await Recipe.findById(originalId);
        assert.include(
            updatedOriginal.calculatedTags,
            'vegan version available',
            'Original recipe should persist the vegan version available calculated tag'
        );
        assert.notInclude(
            updatedOriginal.calculatedTags,
            'vegan_version_available',
            'Original recipe should not use an underscored vegan version tag'
        );
    });

    it('should NOT leave an orphaned vegan copy behind when atomic create fails linkability checks', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const originalResponse = await createRecipe(this, user, {
            title: 'Atomic Conflict Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const firstResponse = await createVeganCopy(this, user, originalId, {
            title: 'Atomic Conflict Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            firstResponse.body.singleResult.errors,
            firstResponse.body.singleResult.errors
                ? firstResponse.body.singleResult.errors[0].message
                : ''
        );

        const failedResponse = await createVeganCopy(this, user, originalId, {
            title: 'Atomic Conflict Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(failedResponse.body.kind, 'single');
        assert.isDefined(failedResponse.body.singleResult.errors, 'Should have errors');
        assert.include(
            failedResponse.body.singleResult.errors[0].message,
            'already has a vegan version'
        );

        const copies = await Recipe.find({
            title: 'Atomic Conflict Soup',
            originalRecipe: { $exists: true },
        });
        assert.lengthOf(copies, 1, 'Only the original atomic vegan copy should exist');
    });

    it('should roll back the vegan copy when the original re-save fails after vegan save succeeds', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const originalResponse = await createRecipe(this, user, {
            title: 'Rollback Original Save Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const savedSave = Recipe.prototype.save;
        Recipe.prototype.save = async function (...args) {
            const isOriginalResave =
                this._id.toString() === originalId && this.veganVersion !== undefined;

            if (isOriginalResave) {
                throw new Error('Simulated original re-save failure');
            }

            return savedSave.apply(this, args);
        };

        try {
            const response = await createVeganCopy(this, user, originalId, {
                title: 'Rollback Original Save Soup',
                ingredientSubsections,
                instructionSubsections,
                numServings: 2,
                tags: [],
                isIngredient: false,
            });

            assert.equal(response.body.kind, 'single');
            assert.isDefined(response.body.singleResult.errors, 'Should have errors');
            assert.include(
                response.body.singleResult.errors[0].message,
                'Simulated original re-save failure'
            );
        } finally {
            Recipe.prototype.save = savedSave;
        }

        const reloadedOriginal = await Recipe.findById(originalId);
        assert.isUndefined(reloadedOriginal.veganVersion, 'Original recipe should roll back veganVersion');

        const copies = await Recipe.find({
            title: 'Rollback Original Save Soup',
            originalRecipe: originalId,
        });
        assert.lengthOf(copies, 0, 'Failed atomic create should not leave an orphaned vegan copy');
    });

    it('should NOT allow recipeCreateOne to create a linked vegan copy for another user original', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const otherUser = await User.register(
            new User({
                username: 'testuser4',
                firstName: 'Tester4',
                lastName: 'McTestFace',
                role: 'user',
            }),
            'password'
        );
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const otherOriginalResponse = await createRecipe(this, otherUser, {
            title: 'Other User Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const otherOriginalId = (
            otherOriginalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const response = await createRecipe(this, user, {
            title: 'Other User Tomato Soup',
            originalRecipe: otherOriginalId,
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Field "originalRecipe" is not defined by type "CreateOneRecipeCreateInput"'
        );
    });

    it('should assign admin-created vegan copies to the original recipe owner', async function () {
        const owner = await User.findOne({ username: 'testuser1' });
        await createAdmin();
        const admin = await User.findOne({ username: 'testuser2' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const originalResponse = await createRecipe(this, owner, {
            title: 'Admin Ownership Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const response = await createVeganCopy(this, admin, originalId, {
            title: 'Admin Ownership Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(response.body.kind, 'single');
        assert.isUndefined(
            response.body.singleResult.errors,
            response.body.singleResult.errors ? response.body.singleResult.errors[0].message : ''
        );

        const veganId = (
            response.body.singleResult.data as {
                recipeCreateVeganVersion: { record: { _id: string } };
            }
        ).recipeCreateVeganVersion.record._id;

        const veganCopy = await Recipe.findById(veganId);
        assert.equal(String(veganCopy.owner), String(owner._id));
    });

    it('should NOT allow recipeCreateOne to create a linked vegan copy with a missing originalRecipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const response = await createRecipe(this, user, {
            title: 'Missing Original Soup',
            originalRecipe: '507f1f77bcf86cd799439011',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should have errors');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Field "originalRecipe" is not defined by type "CreateOneRecipeCreateInput"'
        );
    });

    it('should NOT create a second vegan copy when the original is already linked before save completes', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const originalResponse = await createRecipe(this, user, {
            title: 'Race Window Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const firstResponse = await createVeganCopy(this, user, originalId, {
            title: 'Race Window Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        assert.isUndefined(
            firstResponse.body.singleResult.errors,
            firstResponse.body.singleResult.errors
                ? firstResponse.body.singleResult.errors[0].message
                : ''
        );

        const duplicateResponse = await createVeganCopy(this, user, originalId, {
            title: 'Race Window Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });

        assert.equal(duplicateResponse.body.kind, 'single');
        assert.isDefined(duplicateResponse.body.singleResult.errors, 'Should have errors');
        assert.include(
            duplicateResponse.body.singleResult.errors[0].message,
            'already has a vegan version'
        );

        const copies = await Recipe.find({
            title: 'Race Window Tomato Soup',
            originalRecipe: { $exists: true },
        });
        assert.lengthOf(copies, 1, 'Only one vegan copy should exist for the original');
    });

    it('should roll back the original veganVersion link if vegan copy persistence fails', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const ingredientSubsections = [
            {
                ingredients: [
                    {
                        ingredient: tomato._id,
                        quantity: '300',
                        unit: unit._id,
                        prepMethod: prepMethod._id,
                    },
                ],
            },
        ];
        const instructionSubsections = [{ name: 'Main', instructions: ['Cook.'] }];

        const originalResponse = await createRecipe(this, user, {
            title: 'Rollback Tomato Soup',
            ingredientSubsections,
            instructionSubsections,
            numServings: 2,
            tags: [],
            isIngredient: false,
        });
        const originalId = (
            originalResponse.body.singleResult.data as {
                recipeCreateOne: { record: { _id: string } };
            }
        ).recipeCreateOne.record._id;

        const savedSave = Recipe.prototype.save;
        Recipe.prototype.save = async function (...args) {
            if (this._id.toString() !== originalId) {
                throw new Error('Simulated vegan save failure');
            }
            return savedSave.apply(this, args);
        };

        try {
            const response = await createVeganCopy(this, user, originalId, {
                title: 'Rollback Tomato Soup',
                ingredientSubsections,
                instructionSubsections,
                numServings: 2,
                tags: [],
                isIngredient: false,
            });

            assert.equal(response.body.kind, 'single');
            assert.isDefined(response.body.singleResult.errors, 'Should have errors');
            assert.include(response.body.singleResult.errors[0].message, 'Simulated vegan save failure');
        } finally {
            Recipe.prototype.save = savedSave;
        }

        const reloadedOriginal = await Recipe.findById(originalId);
        assert.isUndefined(reloadedOriginal.veganVersion, 'Original recipe should not keep a stale vegan link');
        const copies = await Recipe.find({
            title: 'Rollback Tomato Soup',
            originalRecipe: { $exists: true },
        });
        assert.lengthOf(copies, 0, 'Failed vegan copy should not be persisted');
    });

    it('should NOT allow a non-vegan-copy recipe to have a duplicate title', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const tomato = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });

        const record = {
            title: 'Tomato Soup',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: tomato._id,
                            quantity: '300',
                            unit: unit._id,
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: 'Main', instructions: ['Cook.'] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
        };

        // Create first recipe
        await createRecipe(this, user, record);

        // Attempt to create a second recipe with the same title (no originalRecipe)
        const response = await createRecipe(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.match(response.body.singleResult.errors[0].message, /Recipe title must be unique/i);
    });
});
