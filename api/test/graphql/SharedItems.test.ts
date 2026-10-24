import { assert } from 'chai';
import mongoose from 'mongoose';
import type { GraphQLResponse } from '@apollo/server';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Unit } from '../../src/models/Unit.js';
import { Size } from '../../src/models/Size.js';
import { User } from '../../src/models/User.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { startServer, stopServer } from '../utils/mongodb.js';

// Verified users share ingredients, units, sizes and prep methods: each sees everyone's, so a
// name must be unique across all owners.

async function registerUser(username: string, role: User['role']) {
    return User.register(new User({ username, firstName: username, lastName: 'Test', role }), 'p');
}

async function execute(
    context: Mocha.Context,
    user: User | null,
    query: string,
    variables: Record<string, unknown> = {}
) {
    return context.apolloServer.executeOperation(
        { query, variables },
        { contextValue: { isAuthenticated: () => user != null, getUser: () => user } }
    );
}

function data<T>(response: GraphQLResponse) {
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
    return response.body.singleResult.data as T;
}

function errorMessage(response: GraphQLResponse) {
    assert(response.body.kind === 'single');
    assert.isDefined(response.body.singleResult.errors, 'An error should occur');
    return response.body.singleResult.errors![0].message;
}

const LIST_QUERY = `
    query {
        ingredientMany { name }
        unitMany { shortSingular }
        sizeMany { value }
        prepMethodMany { value }
    }`;

type Lists = {
    ingredientMany: { name: string }[];
    unitMany: { shortSingular: string }[];
    sizeMany: { value: string }[];
    prepMethodMany: { value: string }[];
};

function names(lists: Lists) {
    return {
        ingredients: lists.ingredientMany.map((i) => i.name).sort(),
        units: lists.unitMany.map((u) => u.shortSingular).sort(),
        sizes: lists.sizeMany.map((s) => s.value).sort(),
        prepMethods: lists.prepMethodMany.map((p) => p.value).sort(),
    };
}

async function createItems(owner: User, label: string) {
    await new Ingredient({
        name: `${label} ingredient`,
        pluralName: `${label} ingredients`,
        isCountable: false,
        owner: owner._id,
        tags: [],
    }).save();
    await new Unit({
        shortSingular: `${label} unit`,
        shortPlural: `${label} units`,
        longSingular: `${label} unit`,
        longPlural: `${label} units`,
        preferredNumberFormat: 'fraction',
        hasSpace: true,
        unique: true,
        dimension: 'count',
        perCanonical: 1,
        owner: owner._id,
    }).save();
    await new Size({ value: `${label} size`, unique: true, owner: owner._id }).save();
    await new PrepMethod({ value: `${label} prep`, unique: true, owner: owner._id }).save();
}

function dropCollections() {
    const names = ['users', 'ingredients', 'units', 'sizes', 'prepmethods'];
    return Promise.all(
        names
            .filter((name) => mongoose.connection.collections[name])
            .map((name) => mongoose.connection.collections[name].drop())
    );
}

describe('Shared ingredients, units, sizes and prep methods', () => {
    before(startServer);
    after(stopServer);

    let user: User;
    let otherUser: User;
    let admin: User;
    let unverified: User;

    beforeEach(async function () {
        user = await registerUser('user', 'user');
        otherUser = await registerUser('other', 'user');
        admin = await registerUser('admin', 'admin');
        unverified = await registerUser('unverified', 'unverified');
        await createItems(user, 'user');
        await createItems(otherUser, 'other');
        await createItems(admin, 'admin');
        await createItems(unverified, 'unverified');
    });

    afterEach(dropCollections);

    describe('lists', () => {
        it("should show a verified user every user's items", async function () {
            const lists = names(data<Lists>(await execute(this, user, LIST_QUERY)));
            const everyone = ['admin', 'other', 'unverified', 'user'];
            assert.deepEqual(
                lists.ingredients,
                everyone.map((label) => `${label} ingredient`)
            );
            assert.deepEqual(
                lists.units,
                everyone.map((label) => `${label} unit`)
            );
            assert.deepEqual(
                lists.sizes,
                everyone.map((label) => `${label} size`)
            );
            assert.deepEqual(
                lists.prepMethods,
                everyone.map((label) => `${label} prep`)
            );
        });

        it("should show an admin every user's items", async function () {
            const lists = names(data<Lists>(await execute(this, admin, LIST_QUERY)));
            assert.include(lists.ingredients, 'other ingredient');
            assert.include(lists.prepMethods, 'other prep');
        });

        it("should show an unverified user only the admins' items and their own", async function () {
            const lists = names(data<Lists>(await execute(this, unverified, LIST_QUERY)));
            assert.deepEqual(lists.ingredients, ['admin ingredient', 'unverified ingredient']);
            assert.deepEqual(lists.units, ['admin unit', 'unverified unit']);
            assert.deepEqual(lists.sizes, ['admin size', 'unverified size']);
            assert.deepEqual(lists.prepMethods, ['admin prep', 'unverified prep']);
        });

        it("should show a logged-out visitor only the admins' items", async function () {
            const lists = names(data<Lists>(await execute(this, null, LIST_QUERY)));
            assert.deepEqual(lists.ingredients, ['admin ingredient']);
            assert.deepEqual(lists.units, ['admin unit']);
            assert.deepEqual(lists.sizes, ['admin size']);
            assert.deepEqual(lists.prepMethods, ['admin prep']);
        });

        it('should hide throwaway units, sizes and prep methods', async function () {
            await new Size({ value: 'throwaway', unique: false, owner: user._id }).save();
            const lists = names(data<Lists>(await execute(this, otherUser, LIST_QUERY)));
            assert.notInclude(lists.sizes, 'throwaway');
        });
    });

    describe('ingredientManyAll', () => {
        const query = 'query { ingredientManyAll { name } }';

        it('should list every ingredient for an admin', async function () {
            const result = data<{ ingredientManyAll: { name: string }[] }>(
                await execute(this, admin, query)
            );
            assert.lengthOf(result.ingredientManyAll, 4);
        });

        it('should NOT answer a verified user who is not an admin', async function () {
            const response = await execute(this, user, query);
            assert.equal(errorMessage(response), 'You are not authorised!');
        });

        it('should NOT answer a logged-out visitor', async function () {
            const response = await execute(this, null, query);
            assert.equal(errorMessage(response), 'You are not authenticated!');
        });
    });

    describe('unique names', () => {
        const createIngredient = `
            mutation ($record: CreateOneIngredientCreateInput!) {
                ingredientCreateOne(record: $record) { record { _id } }
            }`;

        it('should NOT let an admin reuse an ingredient name another user owns', async function () {
            const response = await execute(this, admin, createIngredient, {
                record: {
                    name: 'other ingredient',
                    pluralName: 'more others',
                    isCountable: false,
                    tags: [],
                },
            });
            assert.equal(
                errorMessage(response),
                'Ingredient validation failed: name: The ingredient name must be unique.'
            );
        });

        it('should NOT let a user reuse a plural name another user owns', async function () {
            const response = await execute(this, user, createIngredient, {
                record: {
                    name: 'something new',
                    pluralName: 'other ingredients',
                    isCountable: false,
                    tags: [],
                },
            });
            assert.equal(
                errorMessage(response),
                'Ingredient validation failed: pluralName: The plural ingredient name must be unique.'
            );
        });

        it("should NOT let a user rename an ingredient to another user's name", async function () {
            const own = await Ingredient.findOne({ name: 'user ingredient' }).orFail();
            const response = await execute(
                this,
                user,
                `mutation ($id: MongoID!, $record: UpdateByIdIngredientInput!) {
                    ingredientUpdateById(_id: $id, record: $record) { recordId }
                }`,
                { id: own._id, record: { name: 'other ingredient' } }
            );
            assert.include(errorMessage(response), 'The ingredient name must be unique.');
        });

        it('should NOT let a user reuse a size another user owns', async function () {
            const response = await execute(
                this,
                user,
                `mutation ($record: CreateOneSizeCreateInput!) {
                    sizeCreateOne(record: $record) { record { _id } }
                }`,
                { record: { value: 'other size', unique: true } }
            );
            assert.include(errorMessage(response), 'The size must be unique.');
        });

        it('should NOT let a user reuse a prep method another user owns', async function () {
            const response = await execute(
                this,
                user,
                `mutation ($record: CreateOnePrepMethodCreateInput!) {
                    prepMethodCreateOne(record: $record) { record { _id } }
                }`,
                { record: { value: 'other prep', unique: true } }
            );
            assert.include(errorMessage(response), 'must be unique.');
        });

        it('should NOT let a user reuse a unit name another user owns', async function () {
            const response = await execute(
                this,
                user,
                `mutation ($record: CreateOneUnitCreateInput!) {
                    unitCreateOne(record: $record) { record { _id } }
                }`,
                {
                    record: {
                        shortSingular: 'other unit',
                        shortPlural: 'fresh units',
                        longSingular: 'fresh unit',
                        longPlural: 'fresh units',
                        preferredNumberFormat: 'fraction',
                        hasSpace: true,
                        unique: true,
                        dimension: 'count',
                        perCanonical: 1,
                    },
                }
            );
            assert.include(errorMessage(response), 'must be unique.');
        });

        it("should let a user reuse another user's name for a throwaway size", async function () {
            const response = await execute(
                this,
                user,
                `mutation ($record: CreateOneSizeCreateInput!) {
                    sizeCreateOne(record: $record) { record { _id } }
                }`,
                { record: { value: 'other size', unique: false } }
            );
            data(response);
        });
    });
});
