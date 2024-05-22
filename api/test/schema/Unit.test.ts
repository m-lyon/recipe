import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { startServer, stopServer } from '../utils/mongodb.js';

async function createUnit(context, user, record) {
    const query = `
    mutation UnitCreateOne($record: CreateOneUnitCreateInput!) {
        unitCreateOne(record: $record) {
          record {
            _id
            longSingular
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

describe('unitCreateOne', function () {
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
        const response = await createUnit(this, user, newRecord);
        const record = parseCreatedUnit(response);
        assert.equal(record.longSingular, 'teaspoon');
    });

    it('should NOT create a unit, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const newRecord = {
            shortPlural: 'tsp',
            shortSingular: 'tsp',
            longPlural: 'teaspoons',
            longSingular: 'teaspoon',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
        };
        await createUnit(this, user, newRecord);
        // Modify the record to only have the same shortPlural
        newRecord.shortSingular = 'tspp';
        newRecord.longPlural = 'teaspoonss';
        newRecord.longSingular = 'teaspoonn';
        const response = await createUnit(this, user, newRecord);
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
        const response = await createUnit(this, user, newRecord);
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors, 'Validation error should occur');
        assert(
            response.body.singleResult.errors[0].message ===
                'Unit validation failed: owner: The owner must be a valid user.'
        );
    });
});

describe('unitUpdateById', () => {
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
            .then(() => mongoose.connection.collections.units.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    async function updateUnit(context, user, id, record) {
        const query = `
        mutation UnitUpdateById($id: MongoID!, $record: UpdateByIdUnitInput!) {
            unitUpdateById(_id: $id, record: $record) {
              record {
                _id
                shortSingular
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
        const recordOneResponse = await createUnit(this, user, recordOneVars);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(this, user, recordTwoVars);
        // Update the ingredient
        const response = await updateUnit(this, user, recordOne._id, { shortSingular: 'tspy' });
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
        const recordOneResponse = await createUnit(this, user, recordOneVars);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(this, user, recordTwoVars);
        // Update the unit
        const response = await updateUnit(this, user, recordOne._id, { shortPlural: 'tbsp' });
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
        const recordOneResponse = await createUnit(this, user, recordOneVars);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(this, user, recordTwoVars);
        // Update the unit
        await User.deleteOne({ username: 'testuser1' });
        const deletedUser = await User.findOne({ username: 'testuser1' });
        assert.isNull(deletedUser);
        const response = await updateUnit(this, user, recordOne._id, { shortSingular: 'tspy' });
        assert(response.body.kind === 'single');
        assert(response.body.singleResult.errors);
        assert(
            response.body.singleResult.errors[0].message ===
                'Unit validation failed: owner: The owner must be a valid user.'
        );
    });
});
