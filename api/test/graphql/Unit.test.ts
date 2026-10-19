import { assert } from 'chai';
import mongoose from 'mongoose';
import type { GraphQLResponse } from '@apollo/server';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { createUser } from '../utils/data.js';
import { Unit } from '../../src/models/Unit.js';
import { User } from '../../src/models/User.js';
import type { DocId, RecordInput } from '../utils/types.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { createRecipeIngredientData, removeRecipeIngredientData } from './Recipe.test.js';

async function createUnit(context: Mocha.Context, user: User, record: RecordInput<Unit>) {
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

const mockHandful = {
    shortPlural: 'handfuls',
    shortSingular: 'handful',
    longPlural: 'handfuls',
    longSingular: 'handful',
    preferredNumberFormat: 'fraction',
    hasSpace: true,
    unique: true,
    dimension: 'count',
    perCanonical: 1,
} satisfies RecordInput<Unit>;
const mockPinch = {
    shortPlural: 'pinches',
    shortSingular: 'pinch',
    longPlural: 'pinches',
    longSingular: 'pinch',
    preferredNumberFormat: 'fraction',
    hasSpace: true,
    unique: true,
    dimension: 'count',
    perCanonical: 1,
} satisfies RecordInput<Unit>;
const mockTeaspoon = {
    shortPlural: 'tsp',
    shortSingular: 'tsp',
    longPlural: 'teaspoons',
    longSingular: 'teaspoon',
    preferredNumberFormat: 'fraction',
    hasSpace: true,
    unique: true,
    dimension: 'volume',
    perCanonical: 4.92892159375,
    system: 'us',
} satisfies RecordInput<Unit>;

async function createAdmin() {
    return User.register(
        new User({ username: 'admin1', firstName: 'Admin', lastName: 'User', role: 'admin' }),
        'password'
    );
}

function errorMessage(response: GraphQLResponse) {
    assert(response.body.kind === 'single');
    assert.isDefined(response.body.singleResult.errors, 'An error should occur');
    return response.body.singleResult.errors![0].message;
}

const parseCreatedUnit = (response: GraphQLResponse) => {
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

    beforeEach(createUser);

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
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const response = await createUnit(this, user, mockHandful);
        const record = parseCreatedUnit(response);
        assert.equal(record.longSingular, 'handful');
    });

    it('should NOT create a unit, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        await createUnit(this, user, mockHandful);
        // Modify the record to only have the same shortPlural
        const newRecord = {
            ...mockHandful,
            shortSingular: 'tspp',
            longPlural: 'teaspoonss',
            longSingular: 'teaspoonn',
        };
        const response = await createUnit(this, user, newRecord);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Unit validation failed: shortPlural: The short plural unit name must be unique.'
        );
    });

    it('should create a unit, duplicate data with unique set to false', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        await createUnit(this, user, { ...mockHandful, unique: false });
        // Modify the record to only have the same shortPlural
        const newRecord = {
            ...mockHandful,
            shortSingular: 'tspp',
            longPlural: 'teaspoonss',
            longSingular: 'teaspoonn',
            unique: false,
        };
        const response = await createUnit(this, user, newRecord);
        const record = parseCreatedUnit(response);
        assert.equal(record.longSingular, 'teaspoonn');
    });

    it('should NOT create a unit, owner does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        await User.deleteOne({ username: 'testuser1' });
        const deletedUser = await User.findOne({ username: 'testuser1' });
        assert.isNull(deletedUser);
        const response = await createUnit(this, user, mockHandful);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Unit validation failed: owner: The owner must be a valid user.'
        );
    });
    it('should NOT let a user create a volume unit', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const response = await createUnit(this, user, mockTeaspoon);
        assert.equal(
            errorMessage(response),
            'Only an admin can create a mass or volume unit. Create a count unit, and record its weight on the ingredient.'
        );
        assert.equal(await Unit.countDocuments(), 0);
    });

    it('should let an admin create a volume unit', async function () {
        const admin = await createAdmin();
        const record = parseCreatedUnit(await createUnit(this, admin, mockTeaspoon));
        assert.equal(record.longSingular, 'teaspoon');
    });

    it('should NOT create a hidden unit', async function () {
        const admin = await createAdmin();
        const response = await createUnit(this, admin, { ...mockHandful, hidden: true });
        assert.equal(errorMessage(response), 'Only a standard unit can be hidden.');
        assert.equal(await Unit.countDocuments(), 0);
    });
});

describe('unitUpdateById', () => {
    before(startServer);
    after(stopServer);

    beforeEach(createUser);

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

    async function updateUnit(
        context: Mocha.Context,
        user: User,
        id: DocId,
        record: RecordInput<Unit>
    ) {
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

    const parseUpdatedUnit = (response: GraphQLResponse) => {
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                unitUpdateById: { record: { _id: string; shortSingular: string } };
            }
        ).unitUpdateById.record;
        return record;
    };

    it('should update a unit', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        // Create the ingredients
        const recordOneResponse = await createUnit(this, user, mockHandful);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(this, user, mockPinch);
        // Update the ingredient
        const response = await updateUnit(this, user, recordOne._id, { shortSingular: 'tspy' });
        const record = parseUpdatedUnit(response);
        assert.equal(record.shortSingular, 'tspy');
    });

    it('should NOT update a unit, duplicate data', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        // Create the ingredients
        const recordOneResponse = await createUnit(this, user, mockHandful);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(this, user, mockPinch);
        // Update the unit
        const response = await updateUnit(this, user, recordOne._id, { shortPlural: 'pinches' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Unit validation failed: shortPlural: The short plural unit name must be unique.'
        );
    });

    it('should update a unit, duplicate data with unique set to false', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        // Create the ingredients
        const recordOneResponse = await createUnit(this, user, { ...mockHandful, unique: false });
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(this, user, { ...mockHandful, unique: false });
        // Update the unit
        const response = await updateUnit(this, user, recordOne._id, { shortSingular: 'tbsp' });
        const record = parseUpdatedUnit(response);
        assert.equal(record.shortSingular, 'tbsp');
    });

    it('should NOT update a unit, owner does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        // Create the ingredients
        const recordOneResponse = await createUnit(this, user, mockHandful);
        const recordOne = parseCreatedUnit(recordOneResponse);
        await createUnit(this, user, mockPinch);
        // Update the unit
        await User.deleteOne({ username: 'testuser1' });
        const deletedUser = await User.findOne({ username: 'testuser1' });
        assert.isNull(deletedUser);
        const response = await updateUnit(this, user, recordOne._id, { shortSingular: 'tspy' });
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Unit validation failed: owner: The owner must be a valid user.'
        );
    });
    async function createStandardTeaspoon(owner: User) {
        return new Unit({ ...mockTeaspoon, owner: owner._id, standard: 'teaspoon' }).save();
    }

    it('should update how a standard unit is written', async function () {
        const admin = await createAdmin();
        const unit = await createStandardTeaspoon(admin);
        // A form sends every field; repeating the stored size is allowed.
        const response = await updateUnit(this, admin, unit._id, {
            ...mockTeaspoon,
            shortSingular: 'tsp.',
        });
        assert.equal(parseUpdatedUnit(response).shortSingular, 'tsp.');
    });

    it('should NOT change the size of a standard unit', async function () {
        const admin = await createAdmin();
        const unit = await createStandardTeaspoon(admin);
        const response = await updateUnit(this, admin, unit._id, { perCanonical: 5 });
        assert.equal(
            errorMessage(response),
            'teaspoon is a standard unit. Its perCanonical cannot be changed.'
        );
        const stored = await Unit.findById(unit._id).orFail();
        assert.equal(stored.perCanonical, 4.92892159375);
    });

    it('should NOT mark a unit as standard', async function () {
        const admin = await createAdmin();
        const unit = parseCreatedUnit(await createUnit(this, admin, mockTeaspoon));
        const response = await updateUnit(this, admin, unit._id, { standard: 'teaspoon' });
        assert.match(errorMessage(response), /is a standard unit/);
    });

    it('should NOT hide a unit that is not standard', async function () {
        const admin = await createAdmin();
        const unit = parseCreatedUnit(await createUnit(this, admin, mockHandful));
        const response = await updateUnit(this, admin, unit._id, { hidden: true });
        assert.equal(errorMessage(response), 'Only a standard unit can be hidden.');
        const stored = await Unit.findById(unit._id).orFail();
        assert.isFalse(stored.hidden);
    });

    it('should NOT let a user turn a count unit into a volume unit', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const unit = parseCreatedUnit(await createUnit(this, user, mockHandful));
        const response = await updateUnit(this, user, unit._id, {
            dimension: 'volume',
            perCanonical: 50,
            system: 'metric',
        });
        assert.equal(
            errorMessage(response),
            'Only an admin can change the size of a mass or volume unit.'
        );
    });
});

describe('unitRemoveById', () => {
    before(startServer);
    after(stopServer);

    beforeEach(async function () {
        await createRecipeIngredientData();
    });

    afterEach(removeRecipeIngredientData);

    async function deleteUnit(context: Mocha.Context, user: User, id: DocId) {
        const query = `
        mutation UnitRemoveById($id: MongoID!) {
            unitRemoveById(_id: $id) {
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

    it('should delete a unit that is not used in recipes', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();

        // Create a new unit that won't be used in recipes
        const unusedUnit = {
            shortSingular: 'xyz',
            shortPlural: 'xyzs',
            longSingular: 'xyz unit',
            longPlural: 'xyz units',
            preferredNumberFormat: 'fraction',
            hasSpace: false,
            unique: true,
            dimension: 'count',
            perCanonical: 1,
        } satisfies RecordInput<Unit>;

        const createResponse = await createUnit(this, user, unusedUnit);
        const createdUnit = parseCreatedUnit(createResponse);

        // Try to delete the unused unit - should succeed
        const response = await deleteUnit(this, user, createdUnit._id);
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = response.body.singleResult.data as { unitRemoveById: { recordId: string } };
        assert.equal(result.unitRemoveById.recordId, createdUnit._id);
    });

    it('should NOT delete a unit that is used in recipes', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const unit = await Unit.findOne({ shortSingular: 'cup' }).orFail();

        // Try to delete the unit that's used in recipes - should fail
        const response = await deleteUnit(this, user, unit._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete unit as it is currently being used in existing recipes.'
        );
        assert.equal(response.body.singleResult.errors[0].extensions.code, 'ITEM_IN_USE');
    });

    it('should NOT delete a unit that is the floor step of a display ladder', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const unit = await Unit.findOne({ shortSingular: 'tsp' }).orFail();

        // Try to delete the unit that's used in a ladder - should fail
        const response = await deleteUnit(this, user, unit._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete unit as it is currently being used in display ladders.'
        );
        assert.equal(response.body.singleResult.errors[0].extensions.code, 'ITEM_IN_USE');
    });

    it('should NOT delete a unit that is a middle step of a display ladder', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const unit = await Unit.findOne({ shortSingular: 'tbsp' }).orFail();

        // Try to delete the unit that's used in a ladder - should fail
        const response = await deleteUnit(this, user, unit._id);
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error should occur');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete unit as it is currently being used in display ladders.'
        );
        assert.equal(response.body.singleResult.errors[0].extensions.code, 'ITEM_IN_USE');
    });

    it('should NOT delete a standard unit', async function () {
        const admin = await createAdmin();
        const unit = await new Unit({
            ...mockTeaspoon,
            shortSingular: 'tspn',
            shortPlural: 'tspn',
            longSingular: 'standard teaspoon',
            longPlural: 'standard teaspoons',
            owner: admin._id,
            standard: 'teaspoon',
        }).save();
        const response = await deleteUnit(this, admin, unit._id);
        assert.equal(
            errorMessage(response),
            'Cannot delete standard teaspoon: it is a standard unit.'
        );
        assert.isNotNull(await Unit.findById(unit._id));
    });
});
