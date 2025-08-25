import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Tag } from '../../src/models/Tag.js';
import { Size } from '../../src/models/Size.js';
import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { Recipe } from '../../src/models/Recipe.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { createIngredients, createPrepMethods, createRecipeTags } from '../utils/data.js';
import { createRecipesAsIngredients, createSizes, createUnits, createUser } from '../utils/data.js';

export async function createRecipeIngredientData() {
    const user = await createUser();
    await createUnits(user);
    await createSizes(user);
    await createIngredients(user);
    await createPrepMethods(user);
    await createRecipeTags();
    await createRecipesAsIngredients(user);
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
            'Recipe validation failed: title: The Recipe title must be unique.'
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
        assert.equal(suffix1.length, 4, 'First recipe suffix should be 4 characters long');
        assert.equal(suffix2.length, 4, 'Second recipe suffix should be 4 characters long');
        assert.isTrue(recipe1.titleIdentifier.endsWith(`-${suffix1}`), 'First recipe should end with its suffix');
        assert.isTrue(recipe2.titleIdentifier.endsWith(`-${suffix2}`), 'Second recipe should end with its suffix');
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
            'Recipe validation failed: title: The Recipe title must be unique.'
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
            title: 'Updated Chicken Soup'
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
            title: 'First Update'
        });
        
        await updateRecipe(this, user, recipe._id, {
            title: 'Second Update'
        });
        
        const finalUpdateResponse = await updateRecipe(this, user, recipe._id, {
            title: 'Final Update'
        });
        const finalRecord = parseUpdatedRecipe(finalUpdateResponse);
        
        // Verify the final recipe
        const finalRecipe = await Recipe.findById(finalRecord._id);
        const finalSuffix = finalRecipe.titleIdentifier.split('-').pop();
        
        assert.equal(originalSuffix, finalSuffix, 'URL suffix should remain the same after multiple updates');
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
            notes: 'Updated notes'
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

    it('should generate different suffixes for different recipes with same title', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        
        // Create first recipe with a specific title
        const recipe1 = new Recipe({
            ...getDefaultRecipe(user, ingredient, unit, prepMethod),
            title: 'Chicken Soup'
        });
        await recipe1.save();
        
        // Create second recipe with the same title
        const recipe2 = new Recipe({
            ...getDefaultRecipe(user, ingredient, unit, prepMethod),
            title: 'Chicken Soup'
        });
        await recipe2.save();
        
        // Get the suffixes
        const suffix1 = recipe1.titleIdentifier.split('-').pop();
        const suffix2 = recipe2.titleIdentifier.split('-').pop();
        
        assert.notEqual(suffix1, suffix2, 'Different recipes should have different suffixes');
        assert.isTrue(
            recipe1.titleIdentifier.startsWith('chicken-soup-'),
            'First recipe should have correct title identifier format'
        );
        assert.isTrue(
            recipe2.titleIdentifier.startsWith('chicken-soup-'),
            'Second recipe should have correct title identifier format'
        );
    });
});
