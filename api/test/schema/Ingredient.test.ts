import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { startServer, stopServer } from '../utils/mongodb.js';

async function createIngredient(context, user, record) {
    const query = `
    mutation IngredientCreateOne($record: CreateOneIngredientCreateInput!) {
        ingredientCreateOne(record: $record) {
          record {
            _id
            name
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

const parseCreatedIngredient = (response) => {
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            ingredientCreateOne: { record: { _id: string; name: string } };
        }
    ).ingredientCreateOne.record;
    return record;
};

describe('ingredientCreateOne', () => {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
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
    });

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.collections.ingredients.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    it('should create an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { name: 'chicken', pluralName: 'chickens', isCountable: true };
        const response = await createIngredient(this, user, newRecord);
        const record = parseCreatedIngredient(response);
        assert.equal(record.name, 'chicken');
    });

    it('should NOT create an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecordOne = { name: 'chicken', pluralName: 'chickens', isCountable: true };
        const newRecordTwo = { name: 'chicken', pluralName: 'chickeny', isCountable: true };
        await createIngredient(this, user, newRecordOne);
        const response = await createIngredient(this, user, newRecordTwo);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation Error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Ingredient validation failed: name: The ingredient name must be unique.'
        );
    });
});

describe('ingredientUpdateById', () => {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
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
    });

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.collections.ingredients.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    async function updateIngredient(context, user, id, record) {
        const query = `
        mutation IngredientUpdateById($id: MongoID!, $record: UpdateByIdIngredientInput!) {
            ingredientUpdateById(_id: $id, record: $record) {
              record {
                _id
                name
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

    it('should update an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { name: 'chicken', pluralName: 'chickens', isCountable: true };
        const recordTwoVars = { name: 'beef', pluralName: 'beefs', isCountable: true };
        const recordOneResponse = await createIngredient(this, user, recordOneVars);
        const recordOne = parseCreatedIngredient(recordOneResponse);
        await createIngredient(this, user, recordTwoVars);
        // Update the ingredient
        const response = await updateIngredient(this, user, recordOne._id, { name: 'chickeny' });
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                ingredientUpdateById: { record: { _id: string; name: string } };
            }
        ).ingredientUpdateById.record;
        assert.equal(updatedRecord.name, 'chickeny');
    });

    it('should NOT update an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { name: 'chicken', pluralName: 'chickens', isCountable: true };
        const recordTwoVars = { name: 'beef', pluralName: 'beefs', isCountable: true };
        const recordOneResponse = await createIngredient(this, user, recordOneVars);
        const recordOne = parseCreatedIngredient(recordOneResponse);
        await createIngredient(this, user, recordTwoVars);
        // Update the ingredient
        const response = await updateIngredient(this, user, recordOne._id, { name: 'beef' });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors);
        assert(
            response.body.singleResult.errors[0].message ===
                'Ingredient validation failed: name: The ingredient name must be unique.'
        );
    });
});
