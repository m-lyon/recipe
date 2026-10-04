import { assert } from 'chai';
import mongoose, { Types } from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { startServer, stopServer } from '../utils/mongodb.js';
import { migrateCanonicalUnits } from '../../src/scripts/migrateCanonicalUnits.js';

const id = () => new Types.ObjectId();

const ids = {
    admin: id(),
    gram: id(),
    kilogram: id(),
    teaspoon: id(),
    tablespoon: id(),
    cup: id(),
    dessertspoon: id(),
    millilitre: id(),
    clove: id(),
    mystery: id(),
    onion: id(),
    flour: id(),
    garlic: id(),
    egg: id(),
    recipe: id(),
};

function unit(_id: Types.ObjectId, longSingular: string, shortSingular: string, extra = {}) {
    return {
        _id,
        shortSingular,
        shortPlural: shortSingular,
        longSingular,
        longPlural: `${longSingular}s`,
        preferredNumberFormat: 'fraction',
        hasSpace: true,
        unique: true,
        owner: ids.admin,
        ...extra,
    };
}

/** The shape of the database before issue #115. */
async function seedLegacy() {
    const db = mongoose.connection.db;
    await db.collection('users').insertOne({ _id: ids.admin, username: 'admin', role: 'admin' });
    await db.collection('units').insertMany([
        unit(ids.gram, 'gram', 'g', { measureType: 'mass' }),
        unit(ids.kilogram, 'kilogram', 'kg', { measureType: 'mass' }),
        // Volume units are sized from the conversion group anchored on teaspoons.
        unit(ids.teaspoon, 'teaspoon', 'tsp', { measureType: 'volume' }),
        unit(ids.tablespoon, 'tablespoon', 'tbsp', { measureType: 'volume' }),
        unit(ids.cup, 'cup', 'cup', { measureType: 'volume' }),
        // Not in the known table: sized only through its conversion rule.
        unit(ids.dessertspoon, 'dessertspoon', 'dsp', { measureType: 'volume' }),
        unit(ids.millilitre, 'milliliter', 'ml', { measureType: 'volume' }),
        unit(ids.clove, 'clove', 'clove', { measureType: null }),
        unit(ids.mystery, 'scoop', 'scoop', { measureType: 'volume' }),
    ]);
    const rules = [
        { _id: id(), unit: ids.tablespoon, baseUnit: ids.teaspoon, baseUnitThreshold: 3, baseToUnitConversion: 3 },
        { _id: id(), unit: ids.cup, baseUnit: ids.teaspoon, baseUnitThreshold: 12, baseToUnitConversion: 48 },
        { _id: id(), unit: ids.dessertspoon, baseUnit: ids.teaspoon, baseUnitThreshold: 2, baseToUnitConversion: 2 },
    ];
    await db.collection('conversionrules').insertMany(rules);
    await db.collection('unitconversions').insertOne({
        _id: id(),
        baseUnit: ids.teaspoon,
        rules: rules.map((rule) => rule._id),
    });
    await db.collection('ingredients').insertMany([
        { _id: ids.onion, name: 'onion', pluralName: 'onions', isCountable: true, owner: ids.admin },
        { _id: ids.flour, name: 'flour', pluralName: 'flour', isCountable: false, density: 0.53, owner: ids.admin },
        { _id: ids.garlic, name: 'garlic', pluralName: 'garlic', isCountable: true, owner: ids.admin },
        { _id: ids.egg, name: 'egg', pluralName: 'eggs', isCountable: true, owner: ids.admin },
    ]);
    await db.collection('nutritionalinfos').insertMany([
        {
            ingredient: ids.onion,
            perGram: { calories: 0.4, protein: 0.011, carbs: 0.093, fat: 0.001 },
            perUnit: { calories: 44, protein: 1.21, carbs: 10.23, fat: 0.11 },
        },
        // perUnit alone cannot survive: perGram is now required.
        { ingredient: ids.egg, perUnit: { calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 } },
    ]);
    await db.collection('recipes').insertOne({
        _id: ids.recipe,
        title: 'Soup',
        ingredientSubsections: [
            {
                ingredients: [
                    { quantity: '2', unit: null, ingredient: ids.onion },
                    { quantity: null, unit: null, ingredient: ids.garlic },
                    { quantity: '1', unit: ids.cup, ingredient: ids.flour },
                ],
            },
            { ingredients: [{ quantity: '1/2', ingredient: ids.onion }] },
        ],
    });
}

async function dropAll() {
    for (const collection of await mongoose.connection.db.listCollections().toArray()) {
        await mongoose.connection.db.dropCollection(collection.name);
    }
}

describe('migrateCanonicalUnits', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedLegacy);
    afterEach(dropAll);

    it('should size known units and units reached through a conversion group', async function () {
        const report = await migrateCanonicalUnits(mongoose.connection.db);
        const units = mongoose.connection.db.collection('units');

        const kilogram = await units.findOne({ _id: ids.kilogram });
        assert.include(kilogram, { dimension: 'mass', perCanonical: 1000, system: 'metric' });
        const millilitre = await units.findOne({ _id: ids.millilitre });
        assert.include(millilitre, { dimension: 'volume', perCanonical: 1, system: 'metric' });
        const dessertspoon = await units.findOne({ _id: ids.dessertspoon });
        assert.include(dessertspoon, { dimension: 'volume', system: 'us' });
        assert.closeTo(dessertspoon!.perCanonical, 2 * 4.92892159375, 1e-9);
        const clove = await units.findOne({ _id: ids.clove });
        assert.include(clove, { dimension: 'count', perCanonical: 1, system: null });
        assert.notProperty(clove, 'measureType');

        assert.deepEqual(report.unitsAssumedCount, ['clove']);
        assert.deepEqual(report.unitsUnassigned, [
            {
                unit: 'scoop',
                reason: 'volume unit with no known size and no sized conversion group',
            },
        ]);
    });

    it('should rewrite quantified unitless lines to each and leave unquantified ones', async function () {
        const report = await migrateCanonicalUnits(mongoose.connection.db);
        const each = await mongoose.connection.db.collection('units').findOne({ longSingular: 'each' });
        assert.include(each, { dimension: 'count', perCanonical: 1, hidden: true, system: null });

        const recipe = await mongoose.connection.db.collection('recipes').findOne({ _id: ids.recipe });
        const [first, second] = recipe!.ingredientSubsections;
        assert.equal(String(first.ingredients[0].unit), String(each!._id));
        assert.isNull(first.ingredients[1].unit);
        assert.equal(String(first.ingredients[2].unit), String(ids.cup));
        assert.equal(String(second.ingredients[0].unit), String(each!._id));
        assert.equal(report.recipeLinesRewritten, 2);
    });

    it('should turn densities and per-unit macros into measures', async function () {
        const report = await migrateCanonicalUnits(mongoose.connection.db);
        const measures = mongoose.connection.db.collection('ingredientmeasures');
        const each = await mongoose.connection.db.collection('units').findOne({ longSingular: 'each' });

        const flour = await measures.findOne({ ingredient: ids.flour });
        assert.include(flour, { grams: 0.53, size: null, prepMethod: null });
        assert.equal(String(flour!.unit), String(ids.millilitre));

        const onion = await measures.findOne({ ingredient: ids.onion });
        assert.equal(String(onion!.unit), String(each!._id));
        assert.closeTo(onion!.grams, 110, 0.01);

        assert.deepEqual(report.perUnitNotMigrated, [
            { ingredient: 'egg', reason: 'no per-gram macros to recover the item weight from' },
        ]);
        assert.deepEqual(
            report.nutritionalInfosRemoved.map((n) => n.ingredient),
            ['egg']
        );
        const ingredient = await mongoose.connection.db.collection('ingredients').findOne({ _id: ids.flour });
        assert.notProperty(ingredient, 'density');
        assert.property(ingredient, 'isCountable', 'isCountable stays as a display flag');
        const info = await mongoose.connection.db.collection('nutritionalinfos').findOne({ ingredient: ids.onion });
        assert.notProperty(info, 'perUnit');
    });

    it('should build ladders with thresholds in canonical units', async function () {
        const report = await migrateCanonicalUnits(mongoose.connection.db);
        assert.sameMembers(report.laddersCreated, ['us-volume', 'metric-mass']);

        const ladders = mongoose.connection.db.collection('displayladders');
        const usVolume = await ladders.findOne({ name: 'us-volume' });
        assert.deepEqual(
            usVolume!.steps.map((step: { unit: Types.ObjectId }) => String(step.unit)),
            [ids.cup, ids.tablespoon, ids.dessertspoon, ids.teaspoon].map(String)
        );
        assert.closeTo(usVolume!.steps[0].minCanonical, 12 * 4.92892159375, 1e-9);
        assert.equal(usVolume!.steps.at(-1).minCanonical, 0);

        const metricMass = await ladders.findOne({ name: 'metric-mass' });
        assert.deepEqual(
            metricMass!.steps.map((step: { minCanonical: number }) => step.minCanonical),
            [1000, 0]
        );
        assert.sameMembers(report.collectionsDropped, ['unitconversions', 'conversionrules']);
    });

    it('should write nothing on a dry run', async function () {
        const report = await migrateCanonicalUnits(mongoose.connection.db, { dryRun: true });
        assert.isTrue(report.dryRun);
        assert.equal(report.recipeLinesRewritten, 2);
        const gram = await mongoose.connection.db.collection('units').findOne({ _id: ids.gram });
        assert.notProperty(gram, 'dimension');
        assert.equal(await mongoose.connection.db.collection('ingredientmeasures').countDocuments(), 0);
        assert.equal(await mongoose.connection.db.collection('unitconversions').countDocuments(), 1);
    });

    it('should change nothing when run a second time', async function () {
        await migrateCanonicalUnits(mongoose.connection.db);
        const report = await migrateCanonicalUnits(mongoose.connection.db);
        assert.lengthOf(report.unitsAssigned, 0);
        assert.deepEqual(
            report.unitsUnassigned.map((u) => u.unit),
            ['scoop']
        );
        assert.equal(report.eachUnit, 'updated');
        assert.equal(report.recipeLinesRewritten, 0);
        assert.equal(report.densityMeasuresCreated, 0);
        assert.equal(report.countMeasuresCreated, 0);
        assert.lengthOf(report.laddersCreated, 0);
    });
});
