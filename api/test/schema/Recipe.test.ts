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
    const ingr = await new Ingredient({
        name: 'chicken',
        pluralName: 'chickens',
        isCountable: true,
        owner: user._id,
    }).save();
    assert(ingr);
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
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
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

    it('should create a recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const newRecord = {
            title: 'Chicken Soup',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            tags: [tag._id],
            isIngredient: false,
        };
        const response = await createRecipe(this, user, newRecord);
        const record = parseCreatedRecipe(response);
        assert(record.title === 'Chicken Soup');
    });

    it('should NOT create a recipe, duplicate title', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecord = {
            title: 'Chicken Soup',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            isIngredient: false,
        };
        await createRecipe(this, user, newRecord);
        const response = await createRecipe(this, user, newRecord);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
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
        const newRecord = {
            title: 'Chicken Soup',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            tags: [tag._id],
            isIngredient: false,
        };
        const response = await createRecipe(this, user, newRecord);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Recipe validation failed: tags: The tags must be valid tags.'
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

    it('should update a recipe notes', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe({
            title: 'Chicken Soup',
            titleIdentifier: 'chicken-soup',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            isIngredient: false,
            owner: user._id,
        });
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, {
            notes: 'This is a fab recipe',
        });
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                recipeUpdateById: { record: { _id: string; title: string } };
            }
        ).recipeUpdateById.record;
        assert(record.title === 'Chicken Soup');
    });

    it('should update a recipe title and titleIdentifier', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const newRecipe = new Recipe({
            title: 'Chicken Soup',
            titleIdentifier: 'chicken-soup',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            isIngredient: false,
            owner: user._id,
        });
        const recipe = await newRecipe.save();
        const response = await updateRecipe(this, user, recipe._id, { title: 'Chicken broth' });
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                recipeUpdateById: {
                    record: { _id: string; title: string };
                };
            }
        ).recipeUpdateById.record;
        assert(record.title === 'Chicken broth');
        const updatedRecipe = await Recipe.findById(recipe._id);
        assert.notEqual(updatedRecipe.titleIdentifier, 'chicken-soup');
    });

    it('should NOT update a recipe', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const recipeOne = new Recipe({
            title: 'Chicken Soup',
            titleIdentifier: 'chicken-soup',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            isIngredient: false,
            owner: user._id,
        });
        const recipe = await recipeOne.save();
        const recipeTwo = new Recipe({
            title: 'Chicken Broth',
            titleIdentifier: 'chicken-broth',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 2,
            isIngredient: false,
            owner: user._id,
        });
        await recipeTwo.save();
        const response = await updateRecipe(this, user, recipe._id, { title: 'Chicken Broth' });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors);
        assert(
            response.body.singleResult.errors[0].message ===
                'Recipe validation failed: title: The Recipe title must be unique.'
        );
    });

    it('should NOT update a recipe, tag does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const unit = await Unit.findOne({ shortSingular: 'g' });
        const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
        const tag = await Tag.findOne({ value: 'dinner' });
        const recipe = new Recipe({
            title: 'Chicken Soup',
            titleIdentifier: 'chicken-soup',
            ingredients: [
                {
                    ingredient: ingredient._id,
                    quantity: '500',
                    unit: unit._id,
                    type: 'ingredient',
                    prepMethod: prepMethod._id,
                },
            ],
            instructions: ['Cook the chicken in the broth.', 'Add the noodles.'],
            numServings: 4,
            isIngredient: false,
            owner: user._id,
        });
        await recipe.save();
        await Tag.deleteOne({ _id: tag._id });
        const deletedTag = await Tag.findById(tag._id);
        assert.isNull(deletedTag);
        const response = await updateRecipe(this, user, recipe._id, { tags: [tag._id] });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Recipe validation failed: tags: The tags must be valid tags.'
        );
    });
});
