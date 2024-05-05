import { assert } from 'chai';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { schema } from '../../src/schema/index.js';
import { User } from '../../src/models/User.js';

const createPrepMethod = async (user, record, apolloServer) => {
    const query = `
    mutation PrepMethodCreateOne($record: CreateOnePrepMethodCreateInput!) {
        prepMethodCreateOne(record: $record) {
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

const parseCreatedPrepMethod = (response) => {
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            prepMethodCreateOne: { record: { _id: string; value: string } };
        }
    ).prepMethodCreateOne.record;
    return record;
};

describe('prepMethodCreateOne', () => {
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
            .then(() => mongoose.connection.collections.prepmethods.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    it('should create a prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'chopped' };
        const response = await createPrepMethod(user, newRecord, apolloServer);
        const record = parseCreatedPrepMethod(response);
        assert.equal(record.value, 'chopped');
    });
});

describe('prepMethodUpdateById', () => {
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
            .then(() => mongoose.connection.collections.prepmethods.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    const updatePrepMethod = async (user, id, record) => {
        const query = `
        mutation UpdatePrepMethodById($id: MongoID!, $record: UpdateByIdPrepMethodInput!) {
            prepMethodUpdateById(_id: $id, record: $record) {
              record {
                _id
                value
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

    it('should update a prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { value: 'chopped' };
        const recordTwoVars = { value: 'diced' };
        const recordOneResponse = await createPrepMethod(user, recordOneVars, apolloServer);
        const recordOne = parseCreatedPrepMethod(recordOneResponse);
        await createPrepMethod(user, recordTwoVars, apolloServer);
        // Update the ingredient
        const response = await updatePrepMethod(user, recordOne._id, { value: 'minced' });
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                prepMethodUpdateById: { record: { _id: string; value: string } };
            }
        ).prepMethodUpdateById.record;
        assert.equal(updatedRecord.value, 'minced');
    });

    it('should NOT update a prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { value: 'chopped' };
        const recordTwoVars = { value: 'diced' };
        const recordOneResponse = await createPrepMethod(user, recordOneVars, apolloServer);
        const recordOne = parseCreatedPrepMethod(recordOneResponse);
        await createPrepMethod(user, recordTwoVars, apolloServer);
        // Update the unit
        const response = await updatePrepMethod(user, recordOne._id, { value: 'diced' });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors);
        assert(
            response.body.singleResult.errors[0].message ===
                'PrepMethod validation failed: value: The prep method must be unique.'
        );
    });
});
