import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { createUser } from '../utils/data.js';
import { User } from '../../src/models/User.js';
import { Recipe } from '../../src/models/Recipe.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { createRecipeIngredientData, removeRecipeIngredientData } from './Recipe.test.js';

async function createPrepMethod(context, user, record) {
    const query = `
    mutation PrepMethodCreateOne($record: CreateOnePrepMethodCreateInput!) {
        prepMethodCreateOne(record: $record) {
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

const parseCreatedPrepMethod = (response) => {
    assert.equal(response.body.kind, 'single');
    assert.isUndefined(response.body.singleResult.errors);

    const record = (
        response.body.singleResult.data as {
            prepMethodCreateOne: { record: { _id: string; value: string } };
        }
    ).prepMethodCreateOne.record;
    return record;
};

describe('prepMethodCreateOne', () => {
    before(startServer);
    after(stopServer);

    beforeEach(createUser);

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.collections.prepmethods.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    it('should create a prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'chopped', unique: true };
        const response = await createPrepMethod(this, user, newRecord);
        const record = parseCreatedPrepMethod(response);
        assert.equal(record.value, 'chopped');
    });

    it('should NOT create a prep method, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'chopped', unique: true };
        await createPrepMethod(this, user, newRecord);
        const response = await createPrepMethod(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'PrepMethod validation failed: value: The prep method must be unique.'
        );
    });

    it('should create a prep method, duplicate data with unique set to false', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'chopped', unique: false };
        await createPrepMethod(this, user, newRecord);
        const response = await createPrepMethod(this, user, newRecord);
        const record = parseCreatedPrepMethod(response);
        assert.equal(record.value, 'chopped');
    });
});

describe('prepMethodUpdateById', () => {
    before(startServer);
    after(stopServer);

    beforeEach(createUser);

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.collections.prepmethods.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    async function updatePrepMethod(context, user, id, record) {
        const query = `
        mutation UpdatePrepMethodById($id: MongoID!, $record: UpdateByIdPrepMethodInput!) {
            prepMethodUpdateById(_id: $id, record: $record) {
              record {
                _id
                value
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

    it('should update a prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { value: 'chopped', unique: true };
        const recordTwoVars = { value: 'diced', unique: true };
        const recordOneResponse = await createPrepMethod(this, user, recordOneVars);
        const recordOne = parseCreatedPrepMethod(recordOneResponse);
        await createPrepMethod(this, user, recordTwoVars);
        // Update the ingredient
        const response = await updatePrepMethod(this, user, recordOne._id, { value: 'minced' });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                prepMethodUpdateById: { record: { _id: string; value: string } };
            }
        ).prepMethodUpdateById.record;
        assert.equal(updatedRecord.value, 'minced');
    });

    it('should NOT update a prep method, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { value: 'chopped', unique: true };
        const recordTwoVars = { value: 'diced', unique: true };
        const recordOneResponse = await createPrepMethod(this, user, recordOneVars);
        const recordOne = parseCreatedPrepMethod(recordOneResponse);
        await createPrepMethod(this, user, recordTwoVars);
        // Update the unit
        const response = await updatePrepMethod(this, user, recordOne._id, { value: 'diced' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'PrepMethod validation failed: value: The prep method must be unique.'
        );
    });

    it('should update a prep method, duplicate data with unique set to false', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { value: 'chopped', unique: false };
        const recordTwoVars = { value: 'diced', unique: false };
        const recordOneResponse = await createPrepMethod(this, user, recordOneVars);
        const recordOne = parseCreatedPrepMethod(recordOneResponse);
        await createPrepMethod(this, user, recordTwoVars);
        // Update the unit
        const response = await updatePrepMethod(this, user, recordOne._id, { value: 'diced' });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                prepMethodUpdateById: { record: { _id: string; value: string } };
            }
        ).prepMethodUpdateById.record;
        assert.equal(updatedRecord.value, 'diced');
    });
});

describe('prepMethodRemoveById', () => {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
        await createRecipeIngredientData();
    });

    afterEach(removeRecipeIngredientData);

    async function deletePrepMethod(context, user, id) {
        const query = `
        mutation PrepMethodRemoveById($id: MongoID!) {
            prepMethodRemoveById(_id: $id) {
                recordId
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

    it('should delete a prep method that is not used in recipes', async function () {
        const user = await User.findOne({ username: 'testuser1' });

        // Create a new prep method that won't be used in recipes
        const unusedPrepMethod = {
            value: 'unused-method',
            unique: true,
        };

        const createResponse = await createPrepMethod(this, user, unusedPrepMethod);
        const createdPrepMethod = parseCreatedPrepMethod(createResponse);

        // Try to delete the unused prep method - should succeed
        const response = await deletePrepMethod(this, user, createdPrepMethod._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = response.body.singleResult.data as {
            prepMethodRemoveById: { recordId: string };
        };
        assert.equal(result.prepMethodRemoveById.recordId, createdPrepMethod._id);
    });

    it('should NOT delete a prep method that is used in recipes', async function () {
        const user = await User.findOne({ username: 'testuser1' });

        // Find the recipe and get the prep method that's used in one of its ingredients
        const recipe = await Recipe.findOne({ title: 'Bimibap' });

        if (!recipe) {
            throw new Error('Recipe not found - test setup issue');
        }

        const ingredient = recipe.get('ingredientSubsections.0.ingredients.0');
        const prepMethodId = ingredient?.prepMethod;

        if (!prepMethodId) {
            throw new Error('Recipe ingredient with prep method not found - test setup issue');
        }

        // Try to delete the prep method that's used in recipes - should fail
        const response = await deletePrepMethod(this, user, prepMethodId);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete prepMethod as it is currently being used in existing recipes.'
        );
        assert.equal(response.body.singleResult.errors[0].extensions.code, 'ITEM_IN_USE');
    });
});
