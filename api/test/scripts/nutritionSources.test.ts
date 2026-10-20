import { assert } from 'chai';
import mongoose, { Types } from 'mongoose';
import { after, afterEach, before, describe, it } from 'mocha';

import { startServer, stopServer } from '../utils/mongodb.js';
import { syncNutritionSources } from '../../src/utils/nutritionSources.js';

const infos = () => mongoose.connection.db.collection('nutritionalinfos');
const perGram = { calories: 1, protein: 0, carbs: 0, fat: 0 };

describe('syncNutritionSources', function () {
    before(startServer);
    after(stopServer);
    afterEach(async function () {
        await infos().deleteMany({});
    });

    it('should set the source of records saved before it existed, and only those', async function () {
        const ids = {
            usda: new Types.ObjectId(),
            manual: new Types.ObjectId(),
            nullId: new Types.ObjectId(),
            off: new Types.ObjectId(),
        };
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

        const report = await syncNutritionSources(mongoose.connection.db);
        assert.deepEqual(report, { usda: 1, manual: 2 });

        const sourceOf = async (_id: Types.ObjectId) =>
            (await infos().findOne({ _id }))?.source as string | undefined;
        assert.equal(await sourceOf(ids.usda), 'usda');
        assert.equal(await sourceOf(ids.manual), 'manual');
        assert.equal(await sourceOf(ids.nullId), 'manual');
        assert.equal(await sourceOf(ids.off), 'openFoodFacts');

        // A second run finds nothing to do.
        assert.deepEqual(await syncNutritionSources(mongoose.connection.db), {
            usda: 0,
            manual: 0,
        });
    });
});
