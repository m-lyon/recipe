import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Tag } from '../../src/models/Tag.js';
import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { Recipe } from '../../src/models/Recipe.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';

export async function createRecipeIngredientData() {
    const user = await User.register(
        new User({
            username: 'testuser1',
            firstName: 'Tester1',
            lastName: 'McTestFace',
            role: 'user',
        }),
        'password'
    );
    assert(user);
    const ingr1 = await new Ingredient({
        name: 'chicken',
        pluralName: 'chickens',
        isCountable: true,
        owner: user._id,
        tags: [],
    }).save();
    assert(ingr1);
    const ingr2 = await new Ingredient({
        name: 'tomato',
        pluralName: 'tomatoes',
        isCountable: true,
        owner: user._id,
        tags: ['vegan'],
    }).save();
    assert(ingr2);
    const unit = await new Unit({
        shortSingular: 'g',
        shortPlural: 'g',
        longSingular: 'gram',
        longPlural: 'grams',
        preferredNumberFormat: 'decimal',
        owner: user._id,
        hasSpace: false,
    }).save();
    assert(unit);
    const prepMethod = await new PrepMethod({
        value: 'chopped',
        owner: user._id,
    }).save();
    assert(prepMethod);
    const tag1 = await new Tag({
        value: 'dinner',
    }).save();
    assert(tag1);
    const tag2 = await new Tag({
        value: 'lunch',
    }).save();
    assert(tag2);
}

export function removeRecipeIngredientData(done) {
    mongoose.connection.collections.users
        .drop()
        .then(() => mongoose.connection.collections.ingredients.drop())
        .then(() => mongoose.connection.collections.units.drop())
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

const parseCreatedRecipe = (response) => {
    assert.equal(response.body.kind, 'single');
    assert.isUndefined(response.body.singleResult.errors, 'No errors should occur');
    const record = (
        response.body.singleResult.data as {
            recipeCreateOne: { record: { _id: string; title: string } };
        }
    ).recipeCreateOne.record;
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

    const getDefaultRecipeRecord = (ingredient, unit, prepMethod, tag?) => {
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
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            tags: [],
            isIngredient: false,
        };
        if (tag) {
            record.tags = [tag._id];
        }
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
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
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
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                        {
                            ingredient: ingredient2._id,
                            quantity: '200',
                            unit: unit._id,
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
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

    it('should NOT create a recipe, one unnamed subsection', async function () {
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
                            type: 'ingredient',
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
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                        {
                            ingredient: ingredient2._id,
                            quantity: '200',
                            unit: unit._id,
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
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

    it('should NOT create a recipe, no subsections', async function () {
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

    const getDefaultRecipeRecord = (owner, ingredient, unit, prepMethod, tag?) => {
        const record = {
            title: 'Chicken Soup',
            titleIdentifier: 'chicken-soup',
            ingredientSubsections: [
                {
                    name: 'Main',
                    ingredients: [
                        {
                            ingredient: ingredient._id,
                            quantity: '500',
                            unit: unit._id,
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            tags: [],
            isIngredient: false,
            owner: owner._id,
            createdAt: new Date(),
            lastModified: new Date(),
        };
        if (tag) {
            record.tags = [tag._id];
        }
        return record;
    };

    it('should update a recipe notes', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipeRecord(user, ingredient, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            notes: 'This is a fab recipe',
        });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                recipeUpdateById: { record: { _id: string; title: string } };
            }
        ).recipeUpdateById.record;
        assert.equal(record.title, 'Chicken Soup');
    });

    it('should update a recipe to be vegan', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'chicken' });
        const ingredient2 = await Ingredient.findOne({ name: 'tomato' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipeRecord(user, ingredient1, unit, prepMethod));
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
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                recipeUpdateById: { record: { _id: string; title: string } };
            }
        ).recipeUpdateById.record;
        const doc = await Recipe.findById(record._id);
        assert(doc.calculatedTags.includes('vegan'), 'Recipe should be vegan');
    });

    it('should update a recipe to not be vegan', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'tomato' });
        const ingredient2 = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipeRecord(user, ingredient1, unit, prepMethod));
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
                            type: 'ingredient',
                            prepMethod: prepMethod._id,
                        },
                    ],
                },
            ],
        });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                recipeUpdateById: { record: { _id: string; title: string } };
            }
        ).recipeUpdateById.record;
        const doc = await Recipe.findById(record._id);
        assert(!doc.calculatedTags.includes('vegan'), 'Recipe should not be vegan');
    });

    it('should update a recipe title and titleIdentifier', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe(getDefaultRecipeRecord(user, ingredient, unit, prepMethod));
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, { title: 'Chicken broth' });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                recipeUpdateById: {
                    record: { _id: string; title: string };
                };
            }
        ).recipeUpdateById.record;
        assert.equal(record.title, 'Chicken broth');
        const updatedRecipe = await Recipe.findById(recipe._id);
        assert.notEqual(updatedRecipe.titleIdentifier, 'chicken-soup');
    });

    it('should NOT update a recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const recipeOne = new Recipe(getDefaultRecipeRecord(user, ingredient, unit, prepMethod));
        const recipe = await recipeOne.save();
        const recipeTwo = new Recipe({
            ...getDefaultRecipeRecord(user, ingredient, unit, prepMethod),
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
        const recipe = new Recipe(getDefaultRecipeRecord(user, ingredient, unit, prepMethod, tag));
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

    it('should NOT update a recipe, one unnamed subsection', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'tomato' });
        const ingredient2 = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe(getDefaultRecipeRecord(user, ingredient1, unit, prepMethod, tag));
        await recipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            ingredient: ingredient1._id,
                            quantity: '300',
                            unit: unit._id,
                            type: 'ingredient',
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
                            type: 'ingredient',
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
        const recipe = new Recipe(getDefaultRecipeRecord(user, ingredient, unit, prepMethod, tag));
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
        const recipe = new Recipe(getDefaultRecipeRecord(user, ingredient, unit, prepMethod, tag));
        await recipe.save();
        const response = await updateRecipe(this, user, recipe._id, { ingredientSubsections: [] });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Recipe validation failed: ingredientSubsections: At least one ingredient subsection is required.'
        );
    });
});
