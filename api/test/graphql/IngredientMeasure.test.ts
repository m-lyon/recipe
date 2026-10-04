import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Unit } from '../../src/models/Unit.js';
import { User } from '../../src/models/User.js';
import { Size } from '../../src/models/Size.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { IngredientMeasure } from '../../src/models/IngredientMeasure.js';
import { createIngredients, createPrepMethods, createSizes } from '../utils/data.js';
import { createUnits, createUser } from '../utils/data.js';

const CREATE_MUTATION = `
    mutation CreateMeasure($record: CreateOneIngredientMeasureInput!) {
        ingredientMeasureCreateOne(record: $record) {
            record {
                _id
                grams
                unit { _id longSingular }
                size { _id value }
                prepMethod { _id value }
            }
        }
    }`;

const REMOVE_MUTATION = `
    mutation RemoveMeasure($id: MongoID!) {
        ingredientMeasureRemoveById(_id: $id) {
            recordId
        }
    }`;

const QUERY_BY_INGREDIENT_IDS = `
    query Measures($ingredientIds: [MongoID!]!) {
        ingredientMeasuresByIngredientIds(ingredientIds: $ingredientIds) {
            _id
            ingredient
            grams
            unit { longSingular dimension }
            size { value }
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
    await createUnits(user);
    await createSizes(user);
    await createIngredients(user);
    await createPrepMethods(user);
    await new Unit({
        shortSingular: 'ea',
        shortPlural: 'ea',
        longSingular: 'each',
        longPlural: 'each',
        preferredNumberFormat: 'fraction',
        owner: user._id,
        hasSpace: true,
        unique: true,
        dimension: 'count',
        perCanonical: 1,
        hidden: true,
    }).save();
}

function dropCollections(done: Mocha.Done) {
    const collections = mongoose.connection.collections;
    const names = ['users', 'units', 'sizes', 'ingredients', 'prepmethods', 'ingredientmeasures'];
    Promise.all(names.filter((name) => collections[name]).map((name) => collections[name].drop()))
        .then(() => done())
        .catch((error) => {
            console.log(error);
            assert.fail('Collections not deleted');
        });
}

type CreateData = {
    ingredientMeasureCreateOne: {
        record: {
            _id: string;
            grams: number;
            unit: { longSingular: string };
            size: { value: string } | null;
            prepMethod: { value: string } | null;
        };
    };
};

async function createMeasure(server, user, record: Record<string, unknown>) {
    return server.executeOperation({ query: CREATE_MUTATION, variables: { record } }, makeContext(user));
}

describe('ingredientMeasureCreateOne', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seed);
    afterEach(dropCollections);

    it('should create a count measure keyed on a size', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const each = await Unit.findOne({ longSingular: 'each' }).orFail();
        const large = await Size.findOne({ value: 'large' }).orFail();
        const response = await createMeasure(this.apolloServer, user, {
            ingredient: tomato._id.toString(),
            unit: each._id.toString(),
            size: large._id.toString(),
            grams: 150,
        });
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (response.body.singleResult.data as CreateData).ingredientMeasureCreateOne
            .record;
        assert.equal(record.grams, 150);
        assert.equal(record.unit.longSingular, 'each');
        assert.equal(record.size!.value, 'large');
        assert.isNull(record.prepMethod);
    });

    it('should allow the same unit with a different prep method', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const cup = await Unit.findOne({ longSingular: 'cup' }).orFail();
        const chopped = await PrepMethod.findOne({ value: 'chopped' }).orFail();
        const base = { ingredient: tomato._id.toString(), unit: cup._id.toString() };
        await createMeasure(this.apolloServer, user, { ...base, grams: 180 });
        const response = await createMeasure(this.apolloServer, user, {
            ...base,
            prepMethod: chopped._id.toString(),
            grams: 160,
        });
        assert.isUndefined(response.body.singleResult.errors);
        assert.equal(await IngredientMeasure.countDocuments(), 2);
    });

    it('should NOT create a duplicate measure for the same key', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const cup = await Unit.findOne({ longSingular: 'cup' }).orFail();
        const record = { ingredient: tomato._id.toString(), unit: cup._id.toString(), grams: 180 };
        await createMeasure(this.apolloServer, user, record);
        const response = await createMeasure(this.apolloServer, user, { ...record, grams: 200 });
        assert.isDefined(response.body.singleResult.errors, 'Validation error expected');
        assert.include(
            response.body.singleResult.errors[0].message,
            'A measure for this unit, size and prep method already exists.'
        );
    });

    it('should NOT create a measure with a weight of 0', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const cup = await Unit.findOne({ longSingular: 'cup' }).orFail();
        const response = await createMeasure(this.apolloServer, user, {
            ingredient: tomato._id.toString(),
            unit: cup._id.toString(),
            grams: 0,
        });
        assert.isDefined(response.body.singleResult.errors, 'Validation error expected');
        assert.include(
            response.body.singleResult.errors[0].message,
            'The weight must be greater than 0.'
        );
    });

    it("should NOT create a measure for another user's ingredient", async function () {
        const other = await User.register(
            new User({ username: 'other', firstName: 'O', lastName: 'U', role: 'user' }),
            'password'
        );
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const cup = await Unit.findOne({ longSingular: 'cup' }).orFail();
        const response = await createMeasure(this.apolloServer, other, {
            ingredient: tomato._id.toString(),
            unit: cup._id.toString(),
            grams: 180,
        });
        assert.isDefined(response.body.singleResult.errors, 'Authorisation error expected');
        assert.equal(response.body.singleResult.errors[0].message, 'You are not authorised!');
    });
});

describe('ingredientMeasuresByIngredientIds', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seed);
    afterEach(dropCollections);

    it('should return the measures of the requested ingredients only', async function () {
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const salt = await Ingredient.findOne({ name: 'salt' }).orFail();
        const each = await Unit.findOne({ longSingular: 'each' }).orFail();
        const tsp = await Unit.findOne({ longSingular: 'teaspoon' }).orFail();
        await new IngredientMeasure({ ingredient: tomato._id, unit: each._id, grams: 123 }).save();
        await new IngredientMeasure({ ingredient: salt._id, unit: tsp._id, grams: 6 }).save();

        const response = await this.apolloServer.executeOperation(
            {
                query: QUERY_BY_INGREDIENT_IDS,
                variables: { ingredientIds: [tomato._id.toString()] },
            },
            makeContext(null)
        );
        assert.isUndefined(response.body.singleResult.errors);
        const results = (
            response.body.singleResult.data as {
                ingredientMeasuresByIngredientIds: Array<{
                    grams: number;
                    unit: { dimension: string };
                    size: null;
                }>;
            }
        ).ingredientMeasuresByIngredientIds;
        assert.lengthOf(results, 1);
        assert.equal(results[0].grams, 123);
        assert.equal(results[0].unit.dimension, 'count');
        assert.isNull(results[0].size);
    });
});

describe('ingredientMeasure removal', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seed);
    afterEach(dropCollections);

    it('should remove a measure as the ingredient owner', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const each = await Unit.findOne({ longSingular: 'each' }).orFail();
        const measure = await new IngredientMeasure({
            ingredient: tomato._id,
            unit: each._id,
            grams: 123,
        }).save();
        const response = await this.apolloServer.executeOperation(
            { query: REMOVE_MUTATION, variables: { id: measure._id.toString() } },
            makeContext(user)
        );
        assert.isUndefined(response.body.singleResult.errors);
        assert.equal(await IngredientMeasure.countDocuments(), 0);
    });

    it('should NOT delete a unit that a measure uses', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const tomato = await Ingredient.findOne({ name: 'tomato' }).orFail();
        const cup = await Unit.findOne({ longSingular: 'cup' }).orFail();
        await new IngredientMeasure({ ingredient: tomato._id, unit: cup._id, grams: 180 }).save();
        const response = await this.apolloServer.executeOperation(
            { query: REMOVE_UNIT_MUTATION, variables: { id: cup._id.toString() } },
            makeContext(user)
        );
        assert.isDefined(response.body.singleResult.errors, 'In-use error expected');
        assert.equal(
            response.body.singleResult.errors[0].message,
            'Cannot delete unit as it is currently being used in ingredient measures.'
        );
    });
});
