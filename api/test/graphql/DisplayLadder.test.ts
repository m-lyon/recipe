import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Unit } from '../../src/models/Unit.js';
import { User } from '../../src/models/User.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { DisplayLadder } from '../../src/models/DisplayLadder.js';
import { createAdmin, createUnits, createUser } from '../utils/data.js';

const CREATE_MUTATION = `
    mutation CreateLadder($record: CreateOneDisplayLadderCreateInput!) {
        displayLadderCreateOne(record: $record) {
            record {
                _id
                name
                scope
                steps { minCanonical unit { longSingular } }
            }
        }
    }`;

const LADDERS_QUERY = `
    query Ladders {
        displayLadderMany {
            name
        }
    }`;

const REMOVE_UNIT_MUTATION = `
    mutation RemoveUnit($id: MongoID!) {
        unitRemoveById(_id: $id) {
            recordId
        }
    }`;

function makeContext(user: unknown) {
    return {
        contextValue: {
            isAuthenticated: () => !!user,
            getUser: () => user,
        },
    };
}

async function seed() {
    const user = await createUser();
    await createAdmin();
    await createUnits(user);
}

function dropCollections(done: Mocha.Done) {
    const collections = mongoose.connection.collections;
    const names = ['users', 'units', 'displayladders'];
    Promise.all(names.filter((name) => collections[name]).map((name) => collections[name].drop()))
        .then(() => done())
        .catch((error) => {
            console.log(error);
            assert.fail('Collections not deleted');
        });
}

async function usVolumeRecord(scope: 'global' | 'user', name = 'us-volume') {
    const cup = await Unit.findOne({ longSingular: 'cup' }).orFail();
    const tbsp = await Unit.findOne({ longSingular: 'tablespoon' }).orFail();
    const tsp = await Unit.findOne({ longSingular: 'teaspoon' }).orFail();
    return {
        name,
        dimension: 'volume',
        system: 'us',
        scope,
        steps: [
            { unit: tsp._id.toString(), minCanonical: 0 },
            { unit: cup._id.toString(), minCanonical: cup.perCanonical },
            { unit: tbsp._id.toString(), minCanonical: tbsp.perCanonical },
        ],
    };
}

type CreateData = {
    displayLadderCreateOne: {
        record: {
            name: string;
            scope: string;
            steps: Array<{ minCanonical: number; unit: { longSingular: string } }>;
        };
    };
};

describe('displayLadderCreateOne', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seed);
    afterEach(dropCollections);

    it('should create a global ladder as admin with steps sorted descending', async function () {
        const admin = await User.findOne({ username: 'testuser2' }).orFail();
        const response = await this.apolloServer.executeOperation(
            { query: CREATE_MUTATION, variables: { record: await usVolumeRecord('global') } },
            makeContext(admin)
        );
        assert.isUndefined(response.body.singleResult.errors);
        const record = (response.body.singleResult.data as CreateData).displayLadderCreateOne
            .record;
        assert.deepEqual(
            record.steps.map((step) => step.unit.longSingular),
            ['cup', 'tablespoon', 'teaspoon']
        );
    });

    it('should NOT create a global ladder as a regular user', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const response = await this.apolloServer.executeOperation(
            { query: CREATE_MUTATION, variables: { record: await usVolumeRecord('global') } },
            makeContext(user)
        );
        assert.isDefined(response.body.singleResult.errors, 'Authorisation error expected');
        assert.equal(response.body.singleResult.errors[0].message, 'You are not authorised!');
    });

    it('should create a user ladder as a regular user', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const response = await this.apolloServer.executeOperation(
            { query: CREATE_MUTATION, variables: { record: await usVolumeRecord('user') } },
            makeContext(user)
        );
        assert.isUndefined(response.body.singleResult.errors);
        assert.equal(await DisplayLadder.countDocuments({ owner: user._id }), 1);
    });

    it('should NOT create a ladder with a unit of another dimension', async function () {
        const admin = await User.findOne({ username: 'testuser2' }).orFail();
        const gram = await Unit.findOne({ longSingular: 'gram' }).orFail();
        const record = await usVolumeRecord('global');
        record.steps.push({ unit: gram._id.toString(), minCanonical: 5 });
        const response = await this.apolloServer.executeOperation(
            { query: CREATE_MUTATION, variables: { record } },
            makeContext(admin)
        );
        assert.isDefined(response.body.singleResult.errors, 'Validation error expected');
        assert.include(
            response.body.singleResult.errors[0].message,
            'Every step unit must exist and match the ladder dimension and system.'
        );
    });

    it('should NOT create a ladder that repeats a unit', async function () {
        const admin = await User.findOne({ username: 'testuser2' }).orFail();
        const record = await usVolumeRecord('global');
        record.steps.push({ ...record.steps[0], minCanonical: 1 });
        const response = await this.apolloServer.executeOperation(
            { query: CREATE_MUTATION, variables: { record } },
            makeContext(admin)
        );
        assert.isDefined(response.body.singleResult.errors, 'Validation error expected');
        assert.include(
            response.body.singleResult.errors[0].message,
            'A unit can appear only once in a ladder.'
        );
    });
});

describe('displayLadderMany', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seed);
    afterEach(dropCollections);

    it("should return global ladders and the reader's own, not other users'", async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const admin = await User.findOne({ username: 'testuser2' }).orFail();
        await new DisplayLadder({ ...(await usVolumeRecord('global')), owner: admin._id }).save();
        await new DisplayLadder({
            ...(await usVolumeRecord('user', 'admin-own')),
            owner: admin._id,
        }).save();
        await new DisplayLadder({
            ...(await usVolumeRecord('user', 'user-own')),
            owner: user._id,
        }).save();

        const response = await this.apolloServer.executeOperation(
            { query: LADDERS_QUERY },
            makeContext(user)
        );
        assert.isUndefined(response.body.singleResult.errors);
        const names = (
            response.body.singleResult.data as { displayLadderMany: Array<{ name: string }> }
        ).displayLadderMany.map((ladder) => ladder.name);
        assert.sameMembers(names, ['us-volume', 'user-own']);
    });

    it('should NOT delete a unit that a ladder uses', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        await new DisplayLadder({ ...(await usVolumeRecord('user')), owner: user._id }).save();
        const cup = await Unit.findOne({ longSingular: 'cup' }).orFail();
        const response = await this.apolloServer.executeOperation(
            { query: REMOVE_UNIT_MUTATION, variables: { id: cup._id.toString() } },
            makeContext(user)
        );
        assert.isDefined(response.body.singleResult.errors, 'In-use error expected');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete unit as it is currently being used in display ladders.'
        );
    });
});
