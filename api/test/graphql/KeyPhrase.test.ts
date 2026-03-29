import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { Recipe } from '../../src/models/Recipe.js';
import { createAdmin, createUser } from '../utils/data.js';
import { startServer, stopServer } from '../utils/mongodb.js';

async function createKeyPhrase(context, user, record) {
    const query = `
    mutation KeyPhraseCreateOne($record: CreateOneKeyPhraseInput!) {
        keyPhraseCreateOne(record: $record) {
          record {
            _id
            value
            description
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

const parseCreatedKeyPhrase = (response) => {
    assert.equal(response.body.kind, 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            keyPhraseCreateOne: {
                record: { _id: string; value: string; description: string };
            };
        }
    ).keyPhraseCreateOne.record;
    return record;
};

function dropCollections(done) {
    mongoose.connection.collections.users
        .drop()
        .then(() => {
            if (mongoose.connection.collections.keyphrases) {
                return mongoose.connection.collections.keyphrases.drop();
            }
        })
        .then(() => done())
        .catch((error) => {
            console.log(error);
            assert.fail('Collections not deleted');
        });
}

describe('keyPhraseCreateOne', function () {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
        await createUser();
        await createAdmin();
    });

    afterEach(function (done) {
        dropCollections(done);
    });

    it('should create a key phrase', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat until a crust forms.' };
        const response = await createKeyPhrase(this, user, newRecord);
        const record = parseCreatedKeyPhrase(response);
        assert.equal(record.value, 'sear');
        assert.equal(record.description, 'To cook at high heat until a crust forms.');
    });

    it('should NOT create a key phrase with a duplicate value', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat.' };
        await createKeyPhrase(this, user, newRecord);
        const response = await createKeyPhrase(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.include(
            response.body.singleResult.errors[0].message,
            'The value must be unique, please try again.'
        );
    });

    it('should NOT create a key phrase with a non admin user', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat.' };
        const response = await createKeyPhrase(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(response.body.singleResult.errors[0].message, 'You are not authorised!');
    });
});

describe('keyPhraseUpdateById', function () {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
        await createUser();
        await createAdmin();
    });

    afterEach(function (done) {
        dropCollections(done);
    });

    async function updateKeyPhrase(context, user, id, record) {
        const query = `
        mutation KeyPhraseUpdateById($id: MongoID!, $record: UpdateByIdKeyPhraseInput!) {
            keyPhraseUpdateById(_id: $id, record: $record) {
              record {
                _id
                value
                description
              }
            }
        }`;
        const response = await context.apolloServer.executeOperation(
            {
                query: query,
                variables: { id, record },
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

    it('should update a key phrase value', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat.' };
        const createResponse = await createKeyPhrase(this, user, newRecord);
        const record = parseCreatedKeyPhrase(createResponse);
        const response = await updateKeyPhrase(this, user, record._id, { value: 'Blanch' });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                keyPhraseUpdateById: {
                    record: { _id: string; value: string; description: string };
                };
            }
        ).keyPhraseUpdateById.record;
        assert.equal(updatedRecord.value, 'blanch');
    });

    it('should update a key phrase description', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat.' };
        const createResponse = await createKeyPhrase(this, user, newRecord);
        const record = parseCreatedKeyPhrase(createResponse);
        const response = await updateKeyPhrase(this, user, record._id, {
            description: 'Updated description.',
        });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                keyPhraseUpdateById: {
                    record: { _id: string; value: string; description: string };
                };
            }
        ).keyPhraseUpdateById.record;
        assert.equal(updatedRecord.description, 'Updated description.');
    });

    it('should NOT update a key phrase with a non admin user', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const admin = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat.' };
        const createResponse = await createKeyPhrase(this, admin, newRecord);
        const record = parseCreatedKeyPhrase(createResponse);
        const response = await updateKeyPhrase(this, user, record._id, { value: 'Blanch' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(response.body.singleResult.errors[0].message, 'You are not authorised!');
    });

    it('should NOT update a key phrase with a duplicate value', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        await createKeyPhrase(this, user, { value: 'Sear', description: 'To cook at high heat.' });
        const createResponse2 = await createKeyPhrase(this, user, {
            value: 'Blanch',
            description: 'Briefly boil.',
        });
        const record2 = parseCreatedKeyPhrase(createResponse2);
        const response = await updateKeyPhrase(this, user, record2._id, { value: 'Sear' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.include(
            response.body.singleResult.errors[0].message,
            'The value must be unique, please try again.'
        );
    });
});

describe('keyPhraseRemoveById', function () {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
        await createUser();
        await createAdmin();
    });

    afterEach(function (done) {
        dropCollections(done);
    });

    async function removeKeyPhrase(context, user, id) {
        const query = `
        mutation KeyPhraseRemoveById($id: MongoID!) {
            keyPhraseRemoveById(_id: $id) {
              record {
                _id
                value
              }
            }
        }`;
        const response = await context.apolloServer.executeOperation(
            {
                query: query,
                variables: { id },
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

    it('should remove a key phrase', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat.' };
        const createResponse = await createKeyPhrase(this, user, newRecord);
        const record = parseCreatedKeyPhrase(createResponse);
        const response = await removeKeyPhrase(this, user, record._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const removedRecord = (
            response.body.singleResult.data as {
                keyPhraseRemoveById: { record: { _id: string; value: string } };
            }
        ).keyPhraseRemoveById.record;
        assert.equal(removedRecord.value, 'sear');
    });

    it('should NOT remove a key phrase with a non admin user', async function () {
        const admin = await User.findOne({ username: 'testuser2' });
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'Sear', description: 'To cook at high heat.' };
        const createResponse = await createKeyPhrase(this, admin, newRecord);
        const record = parseCreatedKeyPhrase(createResponse);
        const response = await removeKeyPhrase(this, user, record._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(response.body.singleResult.errors[0].message, 'You are not authorised!');
    });
});

describe('keyPhraseMany', function () {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
        await createUser();
        await createAdmin();
    });

    afterEach(function (done) {
        dropCollections(done);
    });

    async function queryKeyPhraseMany(context, user?) {
        const query = `
        query KeyPhraseMany {
            keyPhraseMany {
              _id
              value
              description
            }
        }`;
        const contextValue = user
            ? {
                  isAuthenticated: () => true,
                  getUser: () => user,
              }
            : {
                  isAuthenticated: () => false,
                  getUser: () => null,
              };
        const response = await context.apolloServer.executeOperation(
            { query },
            { contextValue }
        );
        return response;
    }

    it('should return all key phrases', async function () {
        const admin = await User.findOne({ username: 'testuser2' });
        await createKeyPhrase(this, admin, { value: 'Sear', description: 'Cook at high heat.' });
        await createKeyPhrase(this, admin, { value: 'Blanch', description: 'Briefly boil.' });

        const response = await queryKeyPhraseMany(this, admin);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const keyPhrases = (
            response.body.singleResult.data as {
                keyPhraseMany: Array<{ _id: string; value: string; description: string }>;
            }
        ).keyPhraseMany;
        assert.equal(keyPhrases.length, 2);
    });

    it('should be accessible to unauthenticated users', async function () {
        const admin = await User.findOne({ username: 'testuser2' });
        await createKeyPhrase(this, admin, { value: 'Sear', description: 'Cook at high heat.' });

        const response = await queryKeyPhraseMany(this);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const keyPhrases = (
            response.body.singleResult.data as {
                keyPhraseMany: Array<{ _id: string; value: string; description: string }>;
            }
        ).keyPhraseMany;
        assert.equal(keyPhrases.length, 1);
    });
});

describe('keyPhraseUsedInRecipes', function () {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
        await createUser();
        await createAdmin();
    });

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => {
                if (mongoose.connection.collections.keyphrases) {
                    return mongoose.connection.collections.keyphrases.drop();
                }
            })
            .then(() => {
                if (mongoose.connection.collections.recipes) {
                    return mongoose.connection.collections.recipes.drop();
                }
            })
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Collections not deleted');
            });
    });

    async function queryKeyPhraseUsedInRecipes(context, user, value: string) {
        const query = `
        query KeyPhraseUsedInRecipes($value: String!) {
            keyPhraseUsedInRecipes(value: $value)
        }`;
        const response = await context.apolloServer.executeOperation(
            {
                query,
                variables: { value },
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

    it('should return true when phrase appears in recipe instructions', async function () {
        const admin = await User.findOne({ username: 'testuser2' });

        // Create a recipe with an instruction that includes "sear"
        // Skip validation since we only need the instruction text for this query
        await new Recipe({
            title: 'Test Recipe',
            titleIdentifier: 'test-recipe',
            instructionSubsections: [
                {
                    instructions: ['Sear the steak until golden brown.'],
                },
            ],
            ingredientSubsections: [{ ingredients: [] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: admin._id,
            createdAt: new Date(),
            lastModified: new Date(),
        }).save({ validateBeforeSave: false });

        const response = await queryKeyPhraseUsedInRecipes(this, admin, 'sear');
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = (
            response.body.singleResult.data as { keyPhraseUsedInRecipes: boolean }
        ).keyPhraseUsedInRecipes;
        assert.isTrue(result);
    });

    it('should return false when phrase does not appear in any recipe', async function () {
        const admin = await User.findOne({ username: 'testuser2' });

        // Create a recipe without the phrase "blanch"
        // Skip validation since we only need the instruction text for this query
        await new Recipe({
            title: 'Test Recipe',
            titleIdentifier: 'test-recipe',
            instructionSubsections: [
                {
                    instructions: ['Cook the pasta in boiling water.'],
                },
            ],
            ingredientSubsections: [{ ingredients: [] }],
            numServings: 2,
            tags: [],
            isIngredient: false,
            owner: admin._id,
            createdAt: new Date(),
            lastModified: new Date(),
        }).save({ validateBeforeSave: false });

        const response = await queryKeyPhraseUsedInRecipes(this, admin, 'blanch');
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = (
            response.body.singleResult.data as { keyPhraseUsedInRecipes: boolean }
        ).keyPhraseUsedInRecipes;
        assert.isFalse(result);
    });
});
