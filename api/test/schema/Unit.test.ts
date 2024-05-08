import { assert } from 'chai';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { schema } from '../../src/schema/index.js';
import { User } from '../../src/models/User.js';

const createUnit = async (user, record, apolloServer) => {
    const query = `
    mutation UnitCreateOne($record: CreateOneUnitCreateInput!) {
        unitCreateOne(record: $record) {
          record {
            _id
            longSingular
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

const parseCreatedUnit = (response) => {
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            unitCreateOne: { record: { _id: string; longSingular: string } };
        }
    ).unitCreateOne.record;
    return record;
};

describe('unitCreateOne', () => {
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
            .then(() => {
                if (mongoose.connection.collections.units) {
                    mongoose.connection.collections.units.drop();
                }
            })
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    it('should create a unit', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = {
            shortPlural: 'tsp',
            shortSingular: 'tsp',
            longPlural: 'teaspoons',
            longSingular: 'teaspoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        const response = await createUnit(user, newRecord, apolloServer);
        const record = parseCreatedUnit(response);
        assert.equal(record.longSingular, 'teaspoon');
    });

    it('should NOT create a unit, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = {
            shortPlural: 'tsp',
            shortSingular: 'tspp',
            longPlural: 'teaspoonss',
            longSingular: 'teaspoonn',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        await createUnit(user, newRecord, apolloServer);
        const response = await createUnit(user, newRecord, apolloServer);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Unit validation failed: shortPlural: The short plural unit name must be unique.',
            `Validation error message mismatch: ${response.body.singleResult.errors[0].message}`
        );
    });

    it('should NOT create a unit, owner does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = {
            shortPlural: 'tsp',
            shortSingular: 'tsp',
            longPlural: 'teaspoons',
            longSingular: 'teaspoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        await User.deleteOne({ username: 'testuser1' });
        const deletedUser = await User.findOne({ username: 'testuser1' });
        assert.isNull(deletedUser);
        const response = await createUnit(user, newRecord, apolloServer);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Unit validation failed: owner: The owner must be a valid user.'
        );
    });
});

describe('unitUpdateById', () => {
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
            .then(() => mongoose.connection.collections.units.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    const updateUnit = async (user, id, record) => {
        const query = `
        mutation UnitUpdateById($id: MongoID!, $record: UpdateByIdUnitInput!) {
            unitUpdateById(_id: $id, record: $record) {
              record {
                _id
                shortSingular
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

    it('should update a unit', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = {
            shortPlural: 'tsp',
            shortSingular: 'tsp',
            longPlural: 'teaspoons',
            longSingular: 'teaspoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        const recordTwoVars = {
            shortPlural: 'tbsp',
            shortSingular: 'tbsp',
            longPlural: 'tablespoons',
            longSingular: 'tablespoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        const recordOneResponse = await createUnit(user, recordOneVars, apolloServer);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(user, recordTwoVars, apolloServer);
        // Update the ingredient
        const response = await updateUnit(user, recordOne._id, { shortSingular: 'tspy' });
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                unitUpdateById: { record: { _id: string; shortSingular: string } };
            }
        ).unitUpdateById.record;
        assert.equal(updatedRecord.shortSingular, 'tspy');
    });

    it('should NOT update a unit, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = {
            shortPlural: 'tsp',
            shortSingular: 'tsp',
            longPlural: 'teaspoons',
            longSingular: 'teaspoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        const recordTwoVars = {
            shortPlural: 'tbsp',
            shortSingular: 'tbsp',
            longPlural: 'tablespoons',
            longSingular: 'tablespoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        const recordOneResponse = await createUnit(user, recordOneVars, apolloServer);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(user, recordTwoVars, apolloServer);
        // Update the unit
        const response = await updateUnit(user, recordOne._id, { shortPlural: 'tbsp' });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors);
        assert(
            response.body.singleResult.errors[0].message ===
                'Unit validation failed: shortPlural: The short plural unit name must be unique.'
        );
    });

    it('should NOT update a unit, owner does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = {
            shortPlural: 'tsp',
            shortSingular: 'tsp',
            longPlural: 'teaspoons',
            longSingular: 'teaspoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        const recordTwoVars = {
            shortPlural: 'tbsp',
            shortSingular: 'tbsp',
            longPlural: 'tablespoons',
            longSingular: 'tablespoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        const recordOneResponse = await createUnit(user, recordOneVars, apolloServer);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(user, recordTwoVars, apolloServer);
        // Update the unit
        await User.deleteOne({ username: 'testuser1' });
        const deletedUser = await User.findOne({ username: 'testuser1' });
        assert.isNull(deletedUser);
        const response = await updateUnit(user, recordOne._id, { shortSingular: 'tspy' });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors);
        assert(
            response.body.singleResult.errors[0].message ===
                'Unit validation failed: owner: The owner must be a valid user.'
        );
    });
});
