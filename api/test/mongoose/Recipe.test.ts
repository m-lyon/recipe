import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe } from 'mocha';

import { User } from '../../src/models/User.js';
import { Recipe } from '../../src/models/Recipe.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { startServer, stopServer } from '../utils/mongodb.js';

const getMockRecipe = async (quantity: string = '1') => {
    const user = await User.findOne({ firstName: 'Tester1' });
    const ingredient = await Ingredient.findOne({ name: 'test ingredient' });

    const recipeIngredient = {
        type: 'ingredient',
        quantity: quantity,
        unit: null,
        size: null,
        ingredient: ingredient._id,
        prepMethod: null,
    };
    const recipe = {
        title: 'Test Recipe',
        titleIdentifier: 'test-recipe',
        ingredientSubsections: [{ ingredients: [recipeIngredient] }],
        instructionSubsections: [{ instructions: ['Test instruction'] }],
        owner: user._id,
        numServings: 2,
        isIngredient: false,
        createdAt: new Date(),
        lastModified: new Date(),
    };
    return new Recipe(recipe);
};

describe('Quantity Validation', function () {
    before(startServer);
    after(stopServer);

    beforeEach(function (done) {
        const user = new User({
            username: 'testuser1',
            firstName: 'Tester1',
            lastName: 'McTestFace',
            role: 'user',
        });
        const ingredient = new Ingredient({
            name: 'test ingredient',
            pluralName: 'test ingredients',
            isCountable: true,
            owner: user._id,
            tags: [],
        });
        user.save()
            .then(() =>
                ingredient
                    .save()
                    .then(() => done())
                    .catch((error) => {
                        console.log(error);
                        assert.fail('Ingredients not saved');
                    })
            )
            .catch((error) => {
                console.log(error);
                assert.fail('Users not saved');
            });
    });

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.collections.ingredients.drop())
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
    });

    const assertValidQuantity = async (quantity: string) => {
        const recipe = await getMockRecipe(quantity);
        try {
            await recipe.save();
            assert.isFalse(recipe.isNew);
        } catch (error) {
            assert.fail(`Quantity '${quantity}' not saved`);
        }
    };

    const assertInvalidQuantity = async (quantity: string) => {
        const recipe = await getMockRecipe(quantity);
        try {
            await recipe.save();
            assert.fail(`Invalid quantity '${quantity}' saved`);
        } catch (error) {
            assert.include(error.message, 'Invalid quantity format');
        }
    };

    it('Should allow whole numbers: 1', async function () {
        await assertValidQuantity('1');
    });

    it('Should allow decimal numbers: 1.5', async function () {
        await assertValidQuantity('1.5');
    });

    it('Should allow fractions: 1/2', async function () {
        await assertValidQuantity('1/2');
    });

    it('Should allow a number range: 1-2', async function () {
        await assertValidQuantity('1-2');
    });

    it('Should allow a number range with fractions: 1/2-1', async function () {
        await assertValidQuantity('1/2-1');
    });

    it('Should allow a number range with decimals: 1.5-2', async function () {
        await assertValidQuantity('1.5-2');
    });

    it('Should NOT allow negative whole numbers: -1', async function () {
        await assertInvalidQuantity('-1');
    });

    it('Should NOT allow negative decimal numbers: -1.5', async function () {
        await assertInvalidQuantity('-1.5');
    });

    it('Should NOT allow negative fractions: -1/2', async function () {
        await assertInvalidQuantity('-1/2');
    });

    it('Should NOT allow invalid fractions: 1/0', async function () {
        await assertInvalidQuantity('1/0');
    });

    it('Should NOT allow invalid strings: abc', async function () {
        await assertInvalidQuantity('abc');
    });

    it('Should NOT allow empty strings', async function () {
        await assertInvalidQuantity('');
    });

    it('Should allow null quantity', async function () {
        await assertValidQuantity(null);
    });
});
