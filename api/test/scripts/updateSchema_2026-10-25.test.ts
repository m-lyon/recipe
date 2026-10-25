import { assert } from 'chai';
import mongoose, { Types } from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { startServer, stopServer } from '../utils/mongodb.js';
import { migrateNutritionPrepMethods } from '../../src/scripts/updateSchema_2026-10-25.js';

const infos = () => mongoose.connection.db.collection('nutritionalinfos');
const PER_GRAM = { calories: 1, protein: 0, carbs: 0, fat: 0 };
const ids = { lime: new Types.ObjectId(), lemon: new Types.ObjectId() };

describe('migrateNutritionPrepMethods', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        // The collection as it was: a unique index on ingredient, and no prepMethod field.
        await infos()
            .drop()
            .catch(() => undefined);
        await infos().createIndex({ ingredient: 1 }, { unique: true });
        await infos().insertMany([
            { ingredient: ids.lime, source: 'manual', perGram: PER_GRAM },
            { ingredient: ids.lemon, source: 'manual', perGram: PER_GRAM },
        ]);
    });
    afterEach(async function () {
        await mongoose.connection.db.dropDatabase();
    });

    const indexNames = async () => (await infos().indexes()).map((index) => index.name);

    it('reports everything and writes nothing on a dry run', async function () {
        const report = await migrateNutritionPrepMethods(mongoose.connection.db, {
            dryRun: true,
        });
        assert.deepEqual(report, { dryRun: true, prepMethodSet: 2, indexDropped: true });
        assert.include(await indexNames(), 'ingredient_1');
        assert.equal(await infos().countDocuments({ prepMethod: { $exists: true } }), 0);
    });

    it('sets prepMethod to null and replaces the index, and is safe to re-run', async function () {
        const report = await migrateNutritionPrepMethods(mongoose.connection.db);
        assert.deepEqual(report, { dryRun: false, prepMethodSet: 2, indexDropped: true });
        assert.equal(await infos().countDocuments({ prepMethod: { $type: 'null' } }), 2);
        const names = await indexNames();
        assert.notInclude(names, 'ingredient_1');
        assert.include(names, 'ingredient_1_prepMethod_1');

        // A record for a prep method is now accepted, and a second one with none is not.
        await infos().insertOne({
            ingredient: ids.lime,
            prepMethod: new Types.ObjectId(),
            source: 'manual',
            perGram: PER_GRAM,
        });
        try {
            await infos().insertOne({
                ingredient: ids.lime,
                prepMethod: null,
                source: 'manual',
                perGram: PER_GRAM,
            });
            assert.fail('Expected a duplicate key error');
        } catch (error) {
            assert.equal((error as { code?: number }).code, 11000);
        }

        const again = await migrateNutritionPrepMethods(mongoose.connection.db);
        assert.deepEqual(again, { dryRun: false, prepMethodSet: 0, indexDropped: false });
    });
});
