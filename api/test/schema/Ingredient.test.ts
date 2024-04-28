import { assert } from 'chai';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { schema } from '../../src/schema/index.js';
import { User } from '../../src/models/User.js';

describe('Update Ingredient', () => {
    let mongoServer: MongoMemoryServer;
    let apolloServer: ApolloServer;

    before(async function () {
        try {
            mongoServer = await MongoMemoryServer.create();
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

    const createIngredient = async (user, record) => {
        const query = `
        mutation IngredientCreateOne($record: CreateOneIngredientCreateInput!) {
            ingredientCreateOne(record: $record) {
              record {
                _id
                name
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

    const updateIngredient = async (user, id, record) => {
        const query = `
        mutation IngredientUpdateById($id: MongoID!, $record: UpdateByIdIngredientInput!) {
            ingredientUpdateById(_id: $id, record: $record) {
              record {
                _id
                name
              }
            }
          }`;
        const response = await apolloServer.executeOperation(
            { query: query, variables: { id, record } },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        return response;
    };

    it('should create an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { name: 'chicken', pluralName: 'chickens', isCountable: true };
        const response = await createIngredient(user, newRecord);
        const record = parseCreatedIngredient(response);
        assert.equal(record.name, 'chicken');
    });

    it('should update an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { name: 'chicken', pluralName: 'chickens', isCountable: true };
        const recordTwoVars = { name: 'beef', pluralName: 'beefs', isCountable: true };
        const recordOneResponse = await createIngredient(user, recordOneVars);
        const recordOne = parseCreatedIngredient(recordOneResponse);
        await createIngredient(user, recordTwoVars);
        // Update the ingredient
        const response = await updateIngredient(user, recordOne._id, { name: 'chickeny' });
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
        const recordOneResponse = await createIngredient(user, recordOneVars);
        const recordOne = parseCreatedIngredient(recordOneResponse);
        await createIngredient(user, recordTwoVars);
        // Update the ingredient
        const response = await updateIngredient(user, recordOne._id, { name: 'beef' });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors);
        assert(
            response.body.singleResult.errors[0].message ===
                'Ingredient validation failed: name: The ingredient name must be unique.'
        );
    });
});
