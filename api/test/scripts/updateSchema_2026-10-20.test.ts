import { assert } from 'chai';
import mongoose, { Types } from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { startServer, stopServer } from '../utils/mongodb.js';
import { migrateNutritionSources } from '../../src/scripts/updateSchema_2026-10-20.js';

const infos = () => mongoose.connection.db.collection('nutritionalinfos');
const perGram = { calories: 1, protein: 0, carbs: 0, fat: 0 };
const ids = {
    usda: new Types.ObjectId(),
    manual: new Types.ObjectId(),
    nullId: new Types.ObjectId(),
    off: new Types.ObjectId(),
};

async function sourceOf(_id: Types.ObjectId) {
    return (await infos().findOne({ _id }))?.source as string | undefined;
}

describe('migrateNutritionSources', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        // Inserted through the driver, as the old schema left them.
        await infos().insertMany([
            { _id: ids.usda, ingredient: new Types.ObjectId(), usdaFdcId: 171077, perGram },
            { _id: ids.manual, ingredient: new Types.ObjectId(), perGram },
            { _id: ids.nullId, ingredient: new Types.ObjectId(), usdaFdcId: null, perGram },
            {
                _id: ids.off,
                ingredient: new Types.ObjectId(),
                source: 'openFoodFacts',
                offBarcode: '5010338301255',
                perGram,
            },
        ]);
    });
    afterEach(async function () {
        await infos().deleteMany({});
    });

    it('should set the source of records saved before it existed, and only those', async function () {
        const report = await migrateNutritionSources(mongoose.connection.db);
        assert.deepEqual(report, { dryRun: false, usda: 1, manual: 2 });

        assert.equal(await sourceOf(ids.usda), 'usda');
        assert.equal(await sourceOf(ids.manual), 'manual');
        assert.equal(await sourceOf(ids.nullId), 'manual');
        assert.equal(await sourceOf(ids.off), 'openFoodFacts');

        // A second run finds nothing to do.
        assert.deepEqual(await migrateNutritionSources(mongoose.connection.db), {
            dryRun: false,
            usda: 0,
            manual: 0,
        });
    });

    it('should count without writing on a dry run', async function () {
        const report = await migrateNutritionSources(mongoose.connection.db, { dryRun: true });
        assert.deepEqual(report, { dryRun: true, usda: 1, manual: 2 });
        assert.isUndefined(await sourceOf(ids.usda));
        assert.isUndefined(await sourceOf(ids.manual));
    });
});
