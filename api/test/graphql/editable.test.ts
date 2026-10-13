import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { Size } from '../../src/models/Size.js';
import { createAdmin, createUser } from '../utils/data.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { startServer, stopServer } from '../utils/mongodb.js';

async function createOtherUser() {
    const user = await User.register(
        new User({
            username: 'testuser4',
            firstName: 'Tester4',
            lastName: 'McTestFace',
            role: 'user',
        }),
        'password'
    );
    assert(user);
    return user;
}

interface Spec {
    field: string;
    filterType: string;
    /** Whether the list hides throwaway (unique: false) documents. */
    hidesThrowaway: boolean;
    /** Saves a document called `name`, and returns its id. */
    create: (name: string, owner: User, unique?: boolean) => Promise<string>;
}

const specs: Spec[] = [
    {
        field: 'unitManyEditable',
        filterType: 'FilterFindManyUnitInput',
        hidesThrowaway: true,
        create: async (name, owner, unique = true) => {
            const unit = await new Unit({
                shortSingular: name,
                shortPlural: `${name}s`,
                longSingular: name,
                longPlural: `${name}s`,
                preferredNumberFormat: 'decimal',
                owner: owner._id,
                hasSpace: true,
                unique,
                dimension: 'count',
                perCanonical: 1,
                system: null,
            }).save();
            return unit._id.toString();
        },
    },
    {
        field: 'sizeManyEditable',
        filterType: 'FilterFindManySizeInput',
        hidesThrowaway: true,
        create: async (name, owner, unique = true) => {
            const size = await new Size({ value: name, unique, owner: owner._id }).save();
            return size._id.toString();
        },
    },
    {
        field: 'prepMethodManyEditable',
        filterType: 'FilterFindManyPrepMethodInput',
        hidesThrowaway: true,
        create: async (name, owner, unique = true) => {
            const prepMethod = await new PrepMethod({
                value: name,
                unique,
                owner: owner._id,
            }).save();
            return prepMethod._id.toString();
        },
    },
    {
        field: 'ingredientManyEditable',
        filterType: 'FilterFindManyIngredientInput',
        hidesThrowaway: false,
        create: async (name, owner) => {
            const ingredient = await new Ingredient({
                name,
                pluralName: `${name}s`,
                isCountable: true,
                owner: owner._id,
                tags: [],
            }).save();
            return ingredient._id.toString();
        },
    },
];

specs.forEach((spec) => {
    describe(spec.field, function () {
        let user: User;
        let admin: User;
        let otherUser: User;
        let userDocId: string;
        let adminDocId: string;
        let otherUserDocId: string;

        before(startServer);
        after(stopServer);

        beforeEach(async function () {
            user = await createUser();
            admin = await createAdmin();
            otherUser = await createOtherUser();
            userDocId = await spec.create('usersthing', user);
            adminDocId = await spec.create('adminsthing', admin);
            otherUserDocId = await spec.create('otherusersthing', otherUser);
        });

        afterEach(async function () {
            await mongoose.connection.dropDatabase();
        });

        async function listEditable(
            context: Mocha.Context,
            asUser: User | null,
            filter?: Record<string, unknown>
        ) {
            const query = `
            query Editable($filter: ${spec.filterType}) {
                ${spec.field}(filter: $filter) {
                    _id
                }
            }`;
            const response = await context.apolloServer.executeOperation(
                { query, variables: { filter } },
                {
                    contextValue: {
                        isAuthenticated: () => asUser !== null,
                        getUser: () => asUser,
                    },
                }
            );
            assert(response.body.kind === 'single');
            return response.body.singleResult;
        }

        async function editableIds(
            context: Mocha.Context,
            asUser: User,
            filter?: Record<string, unknown>
        ) {
            const result = await listEditable(context, asUser, filter);
            assert.isUndefined(result.errors);
            const data = result.data as Record<string, { _id: string }[]>;
            return data[spec.field].map((doc) => doc._id).sort();
        }

        it('should list only the documents a user owns', async function () {
            const ids = await editableIds(this, user);
            assert.deepEqual(ids, [userDocId]);
        });

        it('should list every document for an admin', async function () {
            const ids = await editableIds(this, admin);
            assert.deepEqual(ids, [userDocId, adminDocId, otherUserDocId].sort());
        });

        it('should NOT let a user widen the list with an owner filter', async function () {
            const ids = await editableIds(this, user, { owner: admin._id.toString() });
            assert.deepEqual(ids, [userDocId]);
        });

        it('should NOT list documents when not logged in', async function () {
            const result = await listEditable(this, null);
            assert.isDefined(result.errors);
            assert.equal(result.errors?.[0].message, 'You are not authenticated!');
        });

        if (spec.hidesThrowaway) {
            it('should NOT list throwaway documents', async function () {
                await spec.create('userthrowaway', user, false);
                await spec.create('adminthrowaway', admin, false);
                assert.deepEqual(await editableIds(this, user), [userDocId]);
                assert.deepEqual(
                    await editableIds(this, admin),
                    [userDocId, adminDocId, otherUserDocId].sort()
                );
            });
        }
    });
});
