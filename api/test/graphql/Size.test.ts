import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { createUser } from '../utils/data.js';
import { User } from '../../src/models/User.js';
import { startServer, stopServer } from '../utils/mongodb.js';

async function createSize(context, user, record) {
    const query = `
    mutation SizeCreateOne($record: CreateOneSizeCreateInput!) {
        sizeCreateOne(record: $record) {
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

const mockSmall = { value: 'small', unique: true };
const mockLarge = { value: 'large', unique: true };

const parseCreatedSize = (response) => {
    assert.equal(response.body.kind, 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            sizeCreateOne: { record: { _id: string; value: string } };
        }
    ).sizeCreateOne.record;
    return record;
};

describe('sizeCreateOne', function () {
    before(startServer);
    after(stopServer);

    beforeEach(createUser);

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => {
                if (mongoose.connection.collections.sizes) {
                    mongoose.connection.collections.sizes.drop();
                }
            })
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    it('should create a size', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const response = await createSize(this, user, mockSmall);
        const record = parseCreatedSize(response);
        assert.equal(record.value, 'small');
    });

    it('should NOT create a size, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        await createSize(this, user, mockSmall);
        const response = await createSize(this, user, mockSmall);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Size validation failed: value: The size must be unique.'
        );
    });

    it('should create a size, duplicate data with unique set to false', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        await createSize(this, user, { ...mockSmall, unique: false });
        const newRecord = { ...mockSmall, unique: false };
        const response = await createSize(this, user, newRecord);
        const record = parseCreatedSize(response);
        assert.equal(record.value, 'small');
    });

    it('should NOT create a size, owner does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        await User.deleteOne({ username: 'testuser1' });
        const deletedUser = await User.findOne({ username: 'testuser1' });
        assert.isNull(deletedUser);
        const response = await createSize(this, user, mockSmall);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Size validation failed: owner: The owner must be a valid user.'
        );
    });
});

describe('sizeUpdateById', () => {
    before(startServer);
    after(stopServer);

    beforeEach(createUser);

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.collections.sizes.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    async function updateSize(context, user, id, record) {
        const query = `
        mutation SizeUpdateById($id: MongoID!, $record: UpdateByIdSizeInput!) {
            sizeUpdateById(_id: $id, record: $record) {
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

    const parseUpdatedSize = (response) => {
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                sizeUpdateById: { record: { _id: string; value: string } };
            }
        ).sizeUpdateById.record;
        return record;
    };

    it('should update a size', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneResponse = await createSize(this, user, mockSmall);
        const recordOne = parseCreatedSize(recordOneResponse);
        await createSize(this, user, mockLarge);
        // Update the ingredient
        const response = await updateSize(this, user, recordOne._id, { value: 'smally' });
        const record = parseUpdatedSize(response);
        assert.equal(record.value, 'smally');
    });

    it('should NOT update a size, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneResponse = await createSize(this, user, mockSmall);
        const recordOne = parseCreatedSize(recordOneResponse);
        await createSize(this, user, mockLarge);
        // Update the size
        const response = await updateSize(this, user, recordOne._id, { value: 'large' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Size validation failed: value: The size must be unique.'
        );
    });

    it('should update a size, duplicate data with unique set to false', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneResponse = await createSize(this, user, { ...mockSmall, unique: false });
        const recordOne = parseCreatedSize(recordOneResponse);
        await createSize(this, user, { ...mockSmall, unique: false });
        // Update the size
        const response = await updateSize(this, user, recordOne._id, { value: 'large' });
        const record = parseUpdatedSize(response);
        assert.equal(record.value, 'large');
    });

    it('should NOT update a size, owner does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Create the ingredients
        const recordOneResponse = await createSize(this, user, mockSmall);
        const recordOne = parseCreatedSize(recordOneResponse);
        await createSize(this, user, mockLarge);
        // Update the size
        await User.deleteOne({ username: 'testuser1' });
        const deletedUser = await User.findOne({ username: 'testuser1' });
        assert.isNull(deletedUser);
        const response = await updateSize(this, user, recordOne._id, { value: 'smally' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Size validation failed: owner: The owner must be a valid user.'
        );
    });
});
