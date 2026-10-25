import { assert } from 'chai';
import mongoose, { Types } from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { startServer, stopServer } from '../utils/mongodb.js';
import { migrateRecipeIngredients } from '../../src/scripts/updateSchema_2026-10-21.js';

const recipes = () => mongoose.connection.db.collection('recipes');
const ids = {
    dough: new Types.ObjectId(),
    pizza: new Types.ObjectId(),
    dinner: new Types.ObjectId(),
    a: new Types.ObjectId(),
    b: new Types.ObjectId(),
    flour: new Types.ObjectId(),
    large: new Types.ObjectId(),
};

function subsections(...ingredients: Array<{ ingredient: Types.ObjectId; size?: Types.ObjectId }>) {
    return [{ ingredients: ingredients.map((ingredient) => ({ quantity: '1', ...ingredient })) }];
}

describe('migrateRecipeIngredients', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        await mongoose.connection.db
            .collection('sizes')
            .insertOne({ _id: ids.large, value: 'large' });
        // Inserted through the driver, as old data could be.
        await recipes().insertMany([
            {
                _id: ids.dough,
                title: 'Pizza Dough',
                isIngredient: true,
                ingredientSubsections: subsections({ ingredient: ids.flour }),
            },
            {
                _id: ids.pizza,
                title: 'Pizza',
                isIngredient: false,
                ingredientSubsections: subsections(
                    { ingredient: ids.dough, size: ids.large },
                    { ingredient: ids.dinner },
                    { ingredient: ids.flour, size: ids.large }
                ),
            },
            {
                _id: ids.dinner,
                title: 'Dinner',
                isIngredient: false,
                ingredientSubsections: subsections({ ingredient: ids.flour }),
            },
            {
                _id: ids.a,
                title: 'A',
                isIngredient: true,
                ingredientSubsections: subsections({ ingredient: ids.b }),
            },
            {
                _id: ids.b,
                title: 'B',
                isIngredient: true,
                ingredientSubsections: subsections({ ingredient: ids.a }),
            },
        ]);
    });
    afterEach(async function () {
        await mongoose.connection.db.dropDatabase();
    });

    const pizzaSizes = async () =>
        (
            (await recipes().findOne({ _id: ids.pizza }))!.ingredientSubsections[0]
                .ingredients as Array<{
                size?: unknown;
            }>
        ).map((ingredient) => ingredient.size ?? null);

    it('reports everything and writes nothing on a dry run', async function () {
        const report = await migrateRecipeIngredients(mongoose.connection.db, { dryRun: true });
        assert.deepEqual(report, {
            dryRun: true,
            sizesCleared: ['Pizza: large Pizza Dough'],
            notIngredient: ['Pizza uses Dinner'],
            cycles: ['A → B → A'],
        });
        assert.equal(String((await pizzaSizes())[0]), String(ids.large));
    });

    it('clears the size on recipes used as ingredients only, and is safe to re-run', async function () {
        await migrateRecipeIngredients(mongoose.connection.db);
        const [dough, , flour] = await pizzaSizes();
        assert.isNull(dough);
        assert.equal(String(flour), String(ids.large), 'an ingredient keeps its size');

        const again = await migrateRecipeIngredients(mongoose.connection.db);
        assert.deepEqual(again.sizesCleared, []);
    });
});
