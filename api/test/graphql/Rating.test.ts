import { assert } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { Recipe } from '../../src/models/Recipe.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { createRecipeIngredientData, removeRecipeIngredientData } from './Recipe.test.js';

async function createRating(context, user, record) {
    const query = `
    mutation RatingCreateOne($record: CreateOneRatingCreateInput!) {
        ratingCreateOne(record: $record) {
          record {
            _id
            value
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

async function createRecipeData() {
    const user = await User.findOne({ username: 'testuser1' });
    const ingredient = await Ingredient.findOne({ name: 'chicken' });
    const unit = await Unit.findOne({ shortSingular: 'g' });
    const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
    const recipe = await new Recipe({
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
        isIngredient: false,
        owner: user._id,
        createdAt: new Date(),
        lastModified: new Date(),
    }).save();
    assert(recipe);
}

const parseCreatedRating = (response) => {
    assert.equal(response.body.kind, 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            ratingCreateOne: { record: { _id: string; value: number } };
        }
    ).ratingCreateOne.record;
    return record;
};

describe('ratingCreateOne', () => {
    before(startServer);
    after(stopServer);

    beforeEach(async () => {
        await createRecipeIngredientData();
        await createRecipeData();
    });
    afterEach(removeRecipeIngredientData);

    it('should create a rating', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        const record = { value: 5, recipe: recipe._id };
        const response = await createRating(this, user, record);
        const createdRating = parseCreatedRating(response);
        assert.equal(createdRating.value, record.value);
    });

    it('should not create a rating with a value less than 0', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        const record = { value: -1, recipe: recipe._id };
        const response = await createRating(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Rating validation failed: value: The rating must be between 0 and 10.'
        );
    });

    it('should not create a rating with a value greater than 10', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        const record = { value: 11, recipe: recipe._id };
        const response = await createRating(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Rating validation failed: value: The rating must be between 0 and 10.'
        );
    });

    it('should not create a rating, recipe does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        await Recipe.deleteOne({ _id: recipe._id });
        const deletedRecipe = await Recipe.findOne({ title: 'Chicken Soup' });
        assert.isNull(deletedRecipe);
        const record = { value: 5, recipe: recipe._id };
        const response = await createRating(this, user, record);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Rating validation failed: recipe: Recipe does not exist.'
        );
    });
});
