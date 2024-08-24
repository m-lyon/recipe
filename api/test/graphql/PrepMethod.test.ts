import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { startServer, stopServer } from '../utils/mongodb.js';

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
        const response = await createPrepMethod(this, user, newRecord);
        const record = parseCreatedPrepMethod(response);
        assert.equal(record.value, 'chopped');
    });

    it('should NOT create a prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'chopped' };
        await createPrepMethod(this, user, newRecord);
        const response = await createPrepMethod(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'PrepMethod validation failed: value: The prep method must be unique.'
        );
    });
});

describe('prepMethodUpdateById', () => {
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
        const recordOneVars = { value: 'chopped' };
        const recordTwoVars = { value: 'diced' };
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

    it('should NOT update a prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneVars = { value: 'chopped' };
        const recordTwoVars = { value: 'diced' };
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
});
