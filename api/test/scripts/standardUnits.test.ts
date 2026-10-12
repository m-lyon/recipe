import { assert } from 'chai';
import mongoose, { Types } from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { STANDARD_UNITS } from '../../src/utils/units.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { syncStandardUnits } from '../../src/utils/standardUnits.js';

const ids = {
    admin: new Types.ObjectId(),
    user: new Types.ObjectId(),
    millilitre: new Types.ObjectId(),
    cup: new Types.ObjectId(),
    bespokeCup: new Types.ObjectId(),
    pound: new Types.ObjectId(),
};

function unit(_id: Types.ObjectId, longSingular: string, shortSingular: string, extra = {}) {
    return {
        _id,
        shortSingular,
        shortPlural: shortSingular,
        longSingular,
        longPlural: `${longSingular}s`,
        preferredNumberFormat: 'decimal',
        hasSpace: true,
        unique: true,
        owner: ids.admin,
        ...extra,
    };
}

const units = () => mongoose.connection.db.collection('units');
const coreKeys = STANDARD_UNITS.filter((u) => u.core).map((u) => u.key);

async function seed() {
    const db = mongoose.connection.db;
    await db.collection('users').insertMany([
        { _id: ids.admin, username: 'admin', role: 'admin' },
        { _id: ids.user, username: 'user', role: 'user' },
    ]);
    await units().insertMany([
        // Another spelling, owned by a user, with a rounded size.
        unit(ids.millilitre, 'milliliter', 'ml', {
            owner: ids.user,
            dimension: 'volume',
            perCanonical: 1.0001,
            system: 'metric',
        }),
        // A user's private "cup" must not become the standard cup.
        unit(ids.bespokeCup, 'cup', 'cup', { owner: ids.user, unique: false }),
        // Recorded as a count unit: adopting it would change what its measures mean.
        unit(ids.pound, 'pound', 'lb', { dimension: 'count', perCanonical: 1, system: null }),
    ]);
}

async function dropAll() {
    for (const collection of await mongoose.connection.db.listCollections().toArray()) {
        await mongoose.connection.db.dropCollection(collection.name);
    }
}

describe('syncStandardUnits', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seed);
    afterEach(dropAll);

    it('should adopt a unit with another spelling, keeping its id', async function () {
        const report = await syncStandardUnits(mongoose.connection.db);
        const millilitre = await units().findOne({ _id: ids.millilitre });
        assert.include(millilitre, { standard: 'millilitre', perCanonical: 1, system: 'metric' });
        assert.equal(String(millilitre!.owner), String(ids.admin), 'every reader can see it');
        assert.equal(millilitre!.longSingular, 'milliliter', 'how it is written stays');
        assert.deepEqual(report.adopted.find((a) => a.unit === 'milliliter')?.changed, [
            'standard',
            'perCanonical',
            'hidden',
            'owner',
        ]);
    });

    it('should create the missing core units, owned by an admin', async function () {
        const report = await syncStandardUnits(mongoose.connection.db);
        const stored = await units()
            .find({ standard: { $ne: null } })
            .toArray();
        const keys = stored.map((u) => u.standard);
        for (const key of coreKeys.filter((k) => k !== 'pound')) {
            assert.include(keys, key);
        }
        assert.notInclude(keys, 'pint', 'units with two common sizes are not created');
        const cup = stored.find((u) => u.standard === 'cup');
        assert.include(cup, { perCanonical: 236.5882365, system: 'us', unique: true });
        assert.equal(String(cup!.owner), String(ids.admin));
        const each = stored.find((u) => u.standard === 'each');
        assert.include(each, { dimension: 'count', hidden: true, system: null });
        assert.include(report.created, 'cup');
    });

    it('should leave units that cannot be the standard unit alone', async function () {
        const report = await syncStandardUnits(mongoose.connection.db);
        const bespoke = await units().findOne({ _id: ids.bespokeCup });
        assert.notProperty(bespoke, 'standard');
        const pound = await units().findOne({ _id: ids.pound });
        assert.include(pound, { dimension: 'count' });
        assert.notProperty(pound, 'standard');
        assert.deepInclude(report.skipped, { unit: 'cup', reason: 'a bespoke unit of one user' });
        assert.deepInclude(report.skipped, {
            unit: 'pound',
            reason: 'a count unit, but pound is mass',
        });
        assert.deepInclude(report.skipped, {
            unit: 'pound',
            reason: 'not created: pound already uses one of its names',
        });
    });

    it('should correct a standard unit whose size was changed in the database', async function () {
        await syncStandardUnits(mongoose.connection.db);
        await units().updateOne({ standard: 'cup' }, { $set: { perCanonical: 250 } });
        const report = await syncStandardUnits(mongoose.connection.db);
        assert.deepEqual(report.corrected, [{ unit: 'cup', changed: ['perCanonical'] }]);
        const cup = await units().findOne({ standard: 'cup' });
        assert.equal(cup!.perCanonical, 236.5882365);
    });

    it('should change nothing when run a second time', async function () {
        await syncStandardUnits(mongoose.connection.db);
        const report = await syncStandardUnits(mongoose.connection.db);
        assert.lengthOf(report.created, 0);
        assert.lengthOf(report.adopted, 0);
        assert.lengthOf(report.corrected, 0);
    });

    it('should write nothing on a dry run', async function () {
        const report = await syncStandardUnits(mongoose.connection.db, { write: false });
        assert.include(report.created, 'cup');
        assert.equal(await units().countDocuments(), 3);
        const millilitre = await units().findOne({ _id: ids.millilitre });
        assert.notProperty(millilitre, 'standard');
    });

    it('should create nothing without an admin', async function () {
        await mongoose.connection.db.collection('users').deleteMany({ role: 'admin' });
        const report = await syncStandardUnits(mongoose.connection.db);
        assert.isTrue(report.missingAdmin);
        assert.lengthOf(report.created, 0);
    });
});
