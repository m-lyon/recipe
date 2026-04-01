import { assert } from 'chai';
import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';
import { stub, restore } from 'sinon';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { createUser, createAdmin } from '../utils/data.js';
import { User } from '../../src/models/User.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { NutritionalInfo } from '../../src/models/NutritionalInfo.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import type { PopulatedRecipe } from '../../src/utils/nutritionalNotifications.js';

// ---------- helpers ----------

async function seedUserAndIngredient() {
    const user = await createUser();
    const ingredient = await new Ingredient({
        name: 'chicken',
        pluralName: 'chickens',
        isCountable: true,
        owner: user._id,
        tags: [],
    }).save();
    return { user, ingredient };
}

const VALID_PER_GRAM = { calories: 1.65, protein: 0.31, carbs: 0, fat: 0.036 };
const VALID_PER_UNIT = { calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 };

// GraphQL operation strings
const CREATE_MUTATION = `
    mutation NutritionalInfoCreateOne($record: CreateOneNutritionalInfoCreateInput!) {
        nutritionalInfoCreateOne(record: $record) {
            record {
                _id
                ingredient
                usdaFdcId
                perGram { calories protein carbs fat }
                perUnit { calories protein carbs fat }
            }
        }
    }`;

const UPDATE_MUTATION = `
    mutation NutritionalInfoUpdateById($id: MongoID!, $record: UpdateByIdNutritionalInfoInput!) {
        nutritionalInfoUpdateById(_id: $id, record: $record) {
            record {
                _id
                perGram { calories protein carbs fat }
                perUnit { calories protein carbs fat }
            }
        }
    }`;

const REMOVE_MUTATION = `
    mutation NutritionalInfoRemoveById($id: MongoID!) {
        nutritionalInfoRemoveById(_id: $id) {
            recordId
        }
    }`;

const QUERY_BY_INGREDIENT = `
    query NutritionalInfoByIngredient($filter: FilterFindOneNutritionalInfoInput) {
        nutritionalInfoByIngredient(filter: $filter) {
            _id
            ingredient
            perGram { calories protein carbs fat }
        }
    }`;

const QUERY_BY_INGREDIENT_IDS = `
    query NutritionalInfosByIngredientIds($ingredientIds: [MongoID!]!) {
        nutritionalInfosByIngredientIds(ingredientIds: $ingredientIds) {
            _id
            ingredient
        }
    }`;

const USDA_SEARCH = `
    query UsdaSearch($query: String!, $pageSize: Int) {
        usdaSearch(query: $query, pageSize: $pageSize) {
            fdcId
            description
            brandOwner
            caloriesPer100g
            proteinPer100g
            carbsPer100g
            fatPer100g
        }
    }`;

const USDA_FOOD_ITEM = `
    query UsdaFoodItem($fdcId: Int!) {
        usdaFoodItem(fdcId: $fdcId) {
            fdcId
            description
            caloriesPer100g
            proteinPer100g
            carbsPer100g
            fatPer100g
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

async function createOtherUser() {
    return User.register(
        new User({
            username: 'other@test.com',
            firstName: 'Other',
            lastName: 'User',
            role: 'user',
        }),
        'password'
    );
}

function dropCollections(done) {
    const collections = mongoose.connection.collections;
    const drops: Promise<boolean>[] = [];
    for (const name of ['users', 'ingredients', 'nutritionalinfos']) {
        if (collections[name]) {
            drops.push(collections[name].drop());
        }
    }
    Promise.all(drops)
        .then(() => done())
        .catch((error) => {
            console.log(error);
            assert.fail('Collections not deleted');
        });
}

// ---------- CRUD tests ----------

describe('nutritionalInfoCreateOne', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedUserAndIngredient);
    afterEach(dropCollections);

    it('should create nutritional info as ingredient owner (perGram only)', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const response = await this.apolloServer.executeOperation(
            {
                query: CREATE_MUTATION,
                variables: {
                    record: {
                        ingredient: ingredient._id.toString(),
                        usdaFdcId: 171077,
                        perGram: VALID_PER_GRAM,
                    },
                },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (response.body.singleResult.data as any).nutritionalInfoCreateOne.record;
        assert.equal(record.ingredient, ingredient._id.toString());
        assert.equal(record.usdaFdcId, 171077);
        assert.approximately(record.perGram.calories, 1.65, 0.001);
        assert.isNull(record.perUnit);
    });

    it('should create nutritional info with both perGram and perUnit', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const response = await this.apolloServer.executeOperation(
            {
                query: CREATE_MUTATION,
                variables: {
                    record: {
                        ingredient: ingredient._id.toString(),
                        perGram: VALID_PER_GRAM,
                        perUnit: VALID_PER_UNIT,
                    },
                },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (response.body.singleResult.data as any).nutritionalInfoCreateOne.record;
        assert.approximately(record.perGram.calories, 1.65, 0.001);
        assert.approximately(record.perUnit.calories, 78, 0.001);
    });

    it('should NOT create nutritional info as non-owner', async function () {
        const owner = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        assert.equal(String(ingredient.owner), String(owner._id));

        // Create a second (non-owner) user
        const otherUser = await createOtherUser();

        const response = await this.apolloServer.executeOperation(
            {
                query: CREATE_MUTATION,
                variables: {
                    record: {
                        ingredient: ingredient._id.toString(),
                        perGram: VALID_PER_GRAM,
                    },
                },
            },
            makeContext(otherUser)
        );
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should fail for non-owner');
        assert.equal(response.body.singleResult.errors[0].message, 'Not authorized');
    });

    it('should allow admin to create nutritional info for any ingredient', async function () {
        const admin = await createAdmin();
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        const response = await this.apolloServer.executeOperation(
            {
                query: CREATE_MUTATION,
                variables: {
                    record: {
                        ingredient: ingredient._id.toString(),
                        perGram: VALID_PER_GRAM,
                    },
                },
            },
            makeContext(admin)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (response.body.singleResult.data as any).nutritionalInfoCreateOne.record;
        assert.approximately(record.perGram.calories, 1.65, 0.001);
    });

    it('should NOT create nutritional info with neither perGram nor perUnit', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        const response = await this.apolloServer.executeOperation(
            {
                query: CREATE_MUTATION,
                variables: {
                    record: {
                        ingredient: ingredient._id.toString(),
                        usdaFdcId: 171077,
                    },
                },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Validation error expected');
        assert.include(
            response.body.singleResult.errors[0].message,
            'at least one of perGram or perUnit'
        );
    });
});

describe('nutritionalInfoUpdateById', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedUserAndIngredient);
    afterEach(dropCollections);

    it('should update nutritional info as ingredient owner', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        // Seed a NutritionalInfo document directly
        const ni = await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const response = await this.apolloServer.executeOperation(
            {
                query: UPDATE_MUTATION,
                variables: {
                    id: ni._id.toString(),
                    record: {
                        perGram: { calories: 2.0, protein: 0.35, carbs: 0.01, fat: 0.05 },
                    },
                },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (response.body.singleResult.data as any).nutritionalInfoUpdateById.record;
        assert.approximately(record.perGram.calories, 2.0, 0.001);
    });

    it('should NOT update nutritional info as non-owner', async function () {
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const ni = await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const otherUser = await createOtherUser();

        const response = await this.apolloServer.executeOperation(
            {
                query: UPDATE_MUTATION,
                variables: {
                    id: ni._id.toString(),
                    record: { perGram: { calories: 99, protein: 0, carbs: 0, fat: 0 } },
                },
            },
            makeContext(otherUser)
        );
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should fail for non-owner');
        assert.equal(response.body.singleResult.errors[0].message, 'Not authorized');
    });
});

describe('nutritionalInfoRemoveById', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedUserAndIngredient);
    afterEach(dropCollections);

    it('should remove nutritional info as ingredient owner', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        const ni = await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const response = await this.apolloServer.executeOperation(
            {
                query: REMOVE_MUTATION,
                variables: { id: ni._id.toString() },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = (response.body.singleResult.data as any).nutritionalInfoRemoveById;
        assert.equal(result.recordId, ni._id.toString());

        // Confirm it was actually deleted
        const found = await NutritionalInfo.findById(ni._id);
        assert.isNull(found);
    });

    it('should NOT remove nutritional info as non-owner', async function () {
        const ingredient = await Ingredient.findOne({ name: 'chicken' });
        const ni = await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const otherUser = await createOtherUser();

        const response = await this.apolloServer.executeOperation(
            {
                query: REMOVE_MUTATION,
                variables: { id: ni._id.toString() },
            },
            makeContext(otherUser)
        );
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should fail for non-owner');
        assert.equal(response.body.singleResult.errors[0].message, 'Not authorized');

        // Confirm it was NOT deleted
        const found = await NutritionalInfo.findById(ni._id);
        assert.isNotNull(found);
    });
});

// ---------- Query tests ----------

describe('nutritionalInfoByIngredient', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedUserAndIngredient);
    afterEach(dropCollections);

    it('should return nutritional info for an ingredient', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const response = await this.apolloServer.executeOperation(
            {
                query: QUERY_BY_INGREDIENT,
                variables: { filter: { ingredient: ingredient._id.toString() } },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = (response.body.singleResult.data as any).nutritionalInfoByIngredient;
        assert.isNotNull(result);
        assert.approximately(result.perGram.calories, 1.65, 0.001);
    });

    it('should return null when ingredient has no nutritional info', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        const response = await this.apolloServer.executeOperation(
            {
                query: QUERY_BY_INGREDIENT,
                variables: { filter: { ingredient: ingredient._id.toString() } },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = (response.body.singleResult.data as any).nutritionalInfoByIngredient;
        assert.isNull(result);
    });
});

describe('nutritionalInfosByIngredientIds', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedUserAndIngredient);
    afterEach(dropCollections);

    it('should return nutritional infos for multiple ingredients', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient1 = await Ingredient.findOne({ name: 'chicken' });
        const ingredient2 = await new Ingredient({
            name: 'tomato',
            pluralName: 'tomatoes',
            isCountable: true,
            owner: user._id,
            tags: [],
        }).save();

        await new NutritionalInfo({
            ingredient: ingredient1._id,
            perGram: VALID_PER_GRAM,
        }).save();
        await new NutritionalInfo({
            ingredient: ingredient2._id,
            perUnit: VALID_PER_UNIT,
        }).save();

        const response = await this.apolloServer.executeOperation(
            {
                query: QUERY_BY_INGREDIENT_IDS,
                variables: {
                    ingredientIds: [ingredient1._id.toString(), ingredient2._id.toString()],
                },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const results = (response.body.singleResult.data as any).nutritionalInfosByIngredientIds;
        assert.equal(results.length, 2);
    });
});

// ---------- USDA proxy tests (mock fetch) ----------

describe('usdaSearch', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedUserAndIngredient);
    afterEach(function (done) {
        restore(); // sinon stubs
        dropCollections(done);
    });

    it('should return mapped USDA search results', async function () {
        const user = await User.findOne({ username: 'testuser1' });

        const mockResponse = {
            foods: [
                {
                    fdcId: 171077,
                    description: 'Chicken, broilers or fryers',
                    brandOwner: null,
                    foodNutrients: [
                        { nutrientId: 1008, value: 165 },
                        { nutrientId: 1003, value: 31 },
                        { nutrientId: 1005, value: 0 },
                        { nutrientId: 1004, value: 3.6 },
                    ],
                },
            ],
        };

        stub(global, 'fetch').resolves({
            ok: true,
            json: async () => mockResponse,
        } as Response);

        const response = await this.apolloServer.executeOperation(
            {
                query: USDA_SEARCH,
                variables: { query: 'chicken', pageSize: 5 },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const results = (response.body.singleResult.data as any).usdaSearch;
        assert.equal(results.length, 1);
        assert.equal(results[0].fdcId, 171077);
        assert.equal(results[0].description, 'Chicken, broilers or fryers');
        assert.equal(results[0].caloriesPer100g, 165);
        assert.equal(results[0].proteinPer100g, 31);
        assert.equal(results[0].carbsPer100g, 0);
        assert.equal(results[0].fatPer100g, 3.6);
    });

    it('should fail for unauthenticated user', async function () {
        const fetchStub = stub(global, 'fetch');

        const response = await this.apolloServer.executeOperation(
            {
                query: USDA_SEARCH,
                variables: { query: 'chicken' },
            },
            makeContext(null)
        );
        assert.equal(response.body.kind, 'single');
        assert.isDefined(response.body.singleResult.errors, 'Should fail unauthenticated');
        assert.include(response.body.singleResult.errors[0].message, 'Not authenticated');
        // fetch should never have been called
        assert.isFalse(fetchStub.called);
    });
});

describe('usdaFoodItem', function () {
    before(startServer);
    after(stopServer);
    beforeEach(seedUserAndIngredient);
    afterEach(function (done) {
        restore();
        dropCollections(done);
    });

    it('should return a mapped USDA food item', async function () {
        const user = await User.findOne({ username: 'testuser1' });

        const mockItem = {
            fdcId: 171077,
            description: 'Chicken, broilers or fryers',
            foodNutrients: [
                { nutrient: { id: 1008 }, amount: 165 },
                { nutrient: { id: 1003 }, amount: 31 },
                { nutrient: { id: 1005 }, amount: 0 },
                { nutrient: { id: 1004 }, amount: 3.6 },
            ],
        };

        stub(global, 'fetch').resolves({
            ok: true,
            json: async () => mockItem,
        } as Response);

        const response = await this.apolloServer.executeOperation(
            {
                query: USDA_FOOD_ITEM,
                variables: { fdcId: 171077 },
            },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const result = (response.body.singleResult.data as any).usdaFoodItem;
        assert.equal(result.fdcId, 171077);
        assert.equal(result.caloriesPer100g, 165);
    });
});

// ---------- sendNutritionalNotifications tests ----------
// We stub sgMail.send directly because ESM module exports cannot be stubbed with sinon.
// The sendEmail function calls sgMail.send internally.

describe('sendNutritionalNotifications', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        await seedUserAndIngredient();
        process.env.EMAIL_FROM = 'noreply@test.com';
    });
    afterEach(function (done) {
        delete process.env.EMAIL_FROM;
        restore();
        dropCollections(done);
    });

    // Dynamic import to get the function after compilation.
    // Works because the production code reads process.env.EMAIL_FROM at call time,
    // allowing tests to set it in beforeEach without cache issues.
    async function getSendNotifications() {
        const mod = await import('../../src/utils/nutritionalNotifications.js');
        return mod.sendNutritionalNotifications;
    }

    it('should send no emails when all ingredients have nutritional data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        // Create nutritional info with perGram
        await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const sgStub = stub(sgMail, 'send').resolves();

        const sendNutritionalNotifications = await getSendNotifications();
        const recipe: PopulatedRecipe = {
            title: 'Test Recipe',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            type: 'ingredient',
                            quantity: '100',
                            ingredient: {
                                _id: ingredient._id,
                                name: 'chicken',
                                owner: user._id,
                            },
                            unit: {
                                _id: new mongoose.Types.ObjectId(),
                                shortSingular: 'g',
                                measureType: 'mass' as const,
                                owner: user._id,
                            },
                        },
                    ],
                },
            ],
        };
        await sendNutritionalNotifications(recipe);
        assert.equal(sgStub.callCount, 0, 'No emails should be sent');
    });

    it('should send email when ingredient has no nutritional info', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        // Do NOT create NutritionalInfo — trigger "no nutritional info" path
        const sgStub = stub(sgMail, 'send').resolves();

        const sendNutritionalNotifications = await getSendNotifications();
        const recipe: PopulatedRecipe = {
            title: 'Test Recipe',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            type: 'ingredient',
                            quantity: '2',
                            ingredient: {
                                _id: ingredient._id,
                                name: 'chicken',
                                owner: user._id,
                            },
                            unit: {
                                _id: new mongoose.Types.ObjectId(),
                                shortSingular: 'cup',
                                measureType: 'volume' as const,
                                owner: user._id,
                            },
                        },
                    ],
                },
            ],
        };
        await sendNutritionalNotifications(recipe);
        assert.equal(sgStub.callCount, 1, 'One email to ingredient owner');
        const msg = sgStub.firstCall.args[0] as unknown as { text: string; to: string; from: string };
        assert.isString(msg.text, 'Email should have a text body');
        assert.isString(msg.to, 'Email should have a recipient');
        assert.isString(msg.from, 'Email should have a sender');
        assert.include(msg.text, 'chicken');
        assert.include(msg.text, 'No nutritional information');
    });

    it('should send email when unit has no measureType', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const sgStub = stub(sgMail, 'send').resolves();

        const sendNutritionalNotifications = await getSendNotifications();
        const recipe: PopulatedRecipe = {
            title: 'Test Recipe',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            type: 'ingredient',
                            quantity: '1',
                            ingredient: {
                                _id: ingredient._id,
                                name: 'chicken',
                                owner: user._id,
                            },
                            unit: {
                                _id: new mongoose.Types.ObjectId(),
                                shortSingular: 'bunch',
                                measureType: undefined,
                                owner: user._id,
                            },
                        },
                    ],
                },
            ],
        };
        await sendNutritionalNotifications(recipe);
        assert.equal(sgStub.callCount, 1);
        const msg = sgStub.firstCall.args[0] as unknown as { text: string };
        assert.isString(msg.text, 'Email should have a text body');
        assert.include(msg.text, 'no measure type');
    });

    it('should send email when volume unit is used but ingredient has no density', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const sgStub = stub(sgMail, 'send').resolves();

        const sendNutritionalNotifications = await getSendNotifications();
        const recipe: PopulatedRecipe = {
            title: 'Test Recipe',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            type: 'ingredient',
                            quantity: '2',
                            ingredient: {
                                _id: ingredient._id,
                                name: 'chicken',
                                density: undefined, // no density
                                owner: user._id,
                            },
                            unit: {
                                _id: new mongoose.Types.ObjectId(),
                                shortSingular: 'cup',
                                measureType: 'volume' as const,
                                owner: user._id,
                            },
                        },
                    ],
                },
            ],
        };
        await sendNutritionalNotifications(recipe);
        assert.equal(sgStub.callCount, 1);
        const msg = sgStub.firstCall.args[0] as unknown as { text: string };
        assert.isString(msg.text, 'Email should have a text body');
        assert.include(msg.text, 'no density');
    });

    it('should notify unit owner separately when different from ingredient owner', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        // Create a second user who owns the unit
        const unitOwner = await User.register(
            new User({
                username: 'unitowner@test.com',
                firstName: 'Unit',
                lastName: 'Owner',
                role: 'user',
            }),
            'password'
        );

        await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const sgStub = stub(sgMail, 'send').resolves();

        const sendNutritionalNotifications = await getSendNotifications();
        const recipe: PopulatedRecipe = {
            title: 'Test Recipe',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            type: 'ingredient',
                            quantity: '1',
                            ingredient: {
                                _id: ingredient._id,
                                name: 'chicken',
                                owner: user._id,
                            },
                            unit: {
                                _id: new mongoose.Types.ObjectId(),
                                shortSingular: 'bunch',
                                measureType: undefined, // no measureType
                                owner: unitOwner._id,
                            },
                        },
                    ],
                },
            ],
        };
        await sendNutritionalNotifications(recipe);
        // Two emails: one to ingredient owner, one to unit owner
        assert.equal(sgStub.callCount, 2, 'Both owners should be notified');
        const recipients = [
            (sgStub.firstCall.args[0] as { to: string }).to,
            (sgStub.secondCall.args[0] as { to: string }).to,
        ];
        assert.include(recipients, (user as unknown as { username: string }).username);
        assert.include(recipients, (unitOwner as unknown as { username: string }).username);
    });

    it('should send no emails when recipe has no ingredients', async function () {
        const sgStub = stub(sgMail, 'send').resolves();

        const sendNutritionalNotifications = await getSendNotifications();
        const recipe: PopulatedRecipe = {
            title: 'Empty Recipe',
            ingredientSubsections: [{ ingredients: [] }],
        };
        await sendNutritionalNotifications(recipe);
        assert.equal(sgStub.callCount, 0);
    });

    it('should send email when ingredient uses no unit but lacks perUnit data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const ingredient = await Ingredient.findOne({ name: 'chicken' });

        // Only perGram, no perUnit
        await new NutritionalInfo({
            ingredient: ingredient._id,
            perGram: VALID_PER_GRAM,
        }).save();

        const sgStub = stub(sgMail, 'send').resolves();

        const sendNutritionalNotifications = await getSendNotifications();
        const recipe: PopulatedRecipe = {
            title: 'Countable Recipe',
            ingredientSubsections: [
                {
                    ingredients: [
                        {
                            type: 'ingredient',
                            quantity: '3',
                            ingredient: {
                                _id: ingredient._id,
                                name: 'chicken',
                                owner: user._id,
                            },
                            unit: undefined, // no unit — countable path
                        },
                    ],
                },
            ],
        };
        await sendNutritionalNotifications(recipe);
        assert.equal(sgStub.callCount, 1);
        const msg = sgStub.firstCall.args[0] as unknown as { text: string };
        assert.isString(msg.text, 'Email should have a text body');
        assert.include(msg.text, 'no per-unit nutritional data');
    });
});
