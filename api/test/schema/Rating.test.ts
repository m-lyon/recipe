import { assert } from 'chai';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { MONGODB_OPTS } from '../utils/mongodb.js';
import { schema } from '../../src/schema/index.js';
import { Recipe } from '../../src/models/Recipe.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { createRecipeIngredientData, removeRecipeIngredientData } from './Recipe.test.js';

const createRating = async (user, record, apolloServer) => {
    const query = `
    mutation RatingCreateOne($record: CreateOneRatingCreateInput!) {
        ratingCreateOne(record: $record) {
          record {
            _id
            value
          }
        }
      }`;
    const response = await apolloServer.executeOperation(
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
};

async function createRecipeData() {
    const user = await User.findOne({ username: 'testuser1' });
    const ingredient = await Ingredient.findOne({ name: 'chicken' });
    const unit = await Unit.findOne({ shortSingular: 'g' });
    const prepMethod = await PrepMethod.findOne({ value: 'chopped' });
    const recipe = await new Recipe({
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
    }).save();
    assert(recipe);
}

const parseCreatedRating = (response) => {
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            ratingCreateOne: { record: { _id: string; value: number } };
        }
    ).ratingCreateOne.record;
    return record;
};

describe('ratingCreateOne', () => {
    let mongoServer: MongoMemoryServer;
    let apolloServer: ApolloServer;

    before(async function () {
        try {
            mongoServer = await MongoMemoryServer.create(MONGODB_OPTS);
            await mongoose.connect(mongoServer.getUri());
            apolloServer = new ApolloServer({ schema });
            await apolloServer.start();
        } catch (error) {
            console.log(error);
            assert.fail('Connection not established');
        }
    });

    after(async function () {
        try {
            await mongoose.connection.close();
            await mongoServer.stop();
            await apolloServer.stop();
        } catch (error) {
            console.log(error);
            assert.fail('Connection not closed');
        }
    });

    beforeEach(async () => {
        await createRecipeIngredientData();
        await createRecipeData();
    });
    afterEach(removeRecipeIngredientData);

    it('should create a rating', async () => {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        const record = { value: 5, recipe: recipe._id };
        const response = await createRating(user, record, apolloServer);
        const createdRating = parseCreatedRating(response);
        assert(createdRating.value === record.value);
    });

    it('should not create a rating with a value less than 0', async () => {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        const record = { value: -1, recipe: recipe._id };
        const response = await createRating(user, record, apolloServer);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Rating validation failed: value: The rating must be between 0 and 10.'
        );
    });

    it('should not create a rating with a value greater than 10', async () => {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        const record = { value: 11, recipe: recipe._id };
        const response = await createRating(user, record, apolloServer);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Rating validation failed: value: The rating must be between 0 and 10.'
        );
    });

    it('should not create a rating, recipe does not exist', async () => {
        const user = await User.findOne({ username: 'testuser1' });
        const recipe = await Recipe.findOne({ title: 'Chicken Soup' });
        await Recipe.deleteOne({ _id: recipe._id });
        const deletedRecipe = await Recipe.findOne({ title: 'Chicken Soup' });
        assert.isNull(deletedRecipe);
        const record = { value: 5, recipe: recipe._id };
        const response = await createRating(user, record, apolloServer);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Rating validation failed: recipe: Recipe does not exist.'
        );
    });
});
