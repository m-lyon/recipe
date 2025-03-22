import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { createAdmin, createUser } from '../utils/data.js';
import { startServer, stopServer } from '../utils/mongodb.js';

async function createTag(context, user, record) {
    const query = `
    mutation TagCreateOne($record: CreateOneTagInput!) {
        tagCreateOne(record: $record) {
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

const parseCreatedTag = (response) => {
    assert.equal(response.body.kind, 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            tagCreateOne: { record: { _id: string; value: string } };
        }
    ).tagCreateOne.record;
    return record;
};

describe('tagCreateOne', function () {
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
                if (mongoose.connection.collections.tags) {
                    mongoose.connection.collections.tags.drop();
                }
            })
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    it('should create a tag', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Nutty' };
        const response = await createTag(this, user, newRecord);
        const record = parseCreatedTag(response);
        assert.equal(record.value, 'nutty');
    });

    it('should NOT create a tag with a forbidden value', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Vegan' };
        const response = await createTag(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Tag validation failed: value: Reserved tag.'
        );
    });

    it('should NOT create a tag with a non admin user', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = { value: 'Nutty' };
        const response = await createTag(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(response.body.singleResult.errors[0].message, 'You are not authorised!');
    });

    it('should NOT create a tag with a duplicate value', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Nutty' };
        await createTag(this, user, newRecord);
        const response = await createTag(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Tag validation failed: value: The tag must be unique.'
        );
    });
});

describe('tagUpdateById', function () {
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
                if (mongoose.connection.collections.tags) {
                    mongoose.connection.collections.tags.drop();
                }
            })
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    async function updateTag(context, user, id, record) {
        const query = `
        mutation TagUpdateById($id: MongoID!, $record: UpdateByIdTagInput!) {
            tagUpdateById(_id: $id, record: $record) {
              record {
                _id
                value
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

    it('should update a tag', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Nutty' };
        const createResponse = await createTag(this, user, newRecord);
        const record = parseCreatedTag(createResponse);
        const response = await updateTag(this, user, record._id, { value: 'Nutty2' });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const updatedRecord = (
            response.body.singleResult.data as {
                tagUpdateById: { record: { _id: string; value: string } };
            }
        ).tagUpdateById.record;
        assert.equal(updatedRecord.value, 'nutty2');
    });

    it('should NOT update a tag with a forbidden value', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Nutty' };
        const createResponse = await createTag(this, user, newRecord);
        const record = parseCreatedTag(createResponse);
        const response = await updateTag(this, user, record._id, { value: 'vegan' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Tag validation failed: value: Reserved tag.'
        );
    });

    it('should NOT update a tag with a non admin user', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const admin = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Nutty' };
        const createResponse = await createTag(this, admin, newRecord);
        const record = parseCreatedTag(createResponse);
        const response = await updateTag(this, user, record._id, { value: 'Nutty2' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(response.body.singleResult.errors[0].message, 'You are not authorised!');
    });

    it('should NOT update a tag with a duplicate value', async function () {
        const user = await User.findOne({ username: 'testuser2' });
        const newRecord = { value: 'Nutty' };
        const createResponse = await createTag(this, user, newRecord);
        parseCreatedTag(createResponse);
        const newRecord2 = { value: 'Nutty2' };
        const createResponse2 = await createTag(this, user, newRecord2);
        const record2 = parseCreatedTag(createResponse2);
        const response = await updateTag(this, user, record2._id, { value: 'Nutty' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Tag validation failed: value: The tag must be unique.'
        );
    });
});
