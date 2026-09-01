import { readFileSync } from 'fs';

import { assert } from 'chai';
import mongoose from 'mongoose';
import { restore, stub } from 'sinon';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Unit } from '../../src/models/Unit.js';
import { User } from '../../src/models/User.js';
import { createAdmin, createUser } from '../utils/data.js';
import { __testables } from '../../src/schema/Usda.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { UnitConversion } from '../../src/models/UnitConversion.js';
import { NutritionalInfo } from '../../src/models/NutritionalInfo.js';

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

const PORTION_FIELDS = `
            portions {
                description
                amount
                modifier
                gramWeight
                kind
                millilitres
                impliedDensity
                ambiguous
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
${PORTION_FIELDS}
        }
    }`;

const USDA_FOOD_ITEM = `
    query UsdaFoodItem($fdcId: Int!) {
        usdaFoodItem(fdcId: $fdcId) {
            fdcId
            description
            dataType
            caloriesPer100g
            proteinPer100g
            carbsPer100g
            fatPer100g
            servingSize
            servingSizeUnit
            householdServingFullText
${PORTION_FIELDS}
        }
    }`;

/** Fixtures are trimmed real FDC `format=full` responses. They live in the source
 *  tree, not in dist/, so resolve them relative to the compiled test's own URL. */
function loadFixture(name: string): Record<string, unknown> {
    const url = new URL(`../../../test/fixtures/usda/${name}.json`, import.meta.url);
    return JSON.parse(readFileSync(url, 'utf-8'));
}

interface Portion {
    description: string;
    amount: number | null;
    modifier: string | null;
    gramWeight: number;
    kind: string;
    millilitres: number | null;
    impliedDensity: number | null;
    ambiguous: boolean;
}

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
        // The USDA search endpoint returns no portion data, so the list is always empty.
        assert.deepEqual(results[0].portions, []);
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

    /** Stubs fetch with `item` and runs usdaFoodItem, returning the resolved item. */
    async function fetchItem(server, user: unknown, item: Record<string, unknown>) {
        stub(global, 'fetch').resolves({ ok: true, json: async () => item } as Response);
        const response = await server.executeOperation(
            { query: USDA_FOOD_ITEM, variables: { fdcId: item['fdcId'] } },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        return (response.body.singleResult.data as any).usdaFoodItem;
    }

    function portionByDescription(portions: Portion[], description: string): Portion {
        const found = portions.find((p) => p.description === description);
        assert.isDefined(found, `No portion described as "${description}"`);
        return found!;
    }

    it('should return a mapped USDA food item', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('no-portions-171077'));

        assert.equal(result.fdcId, 171077);
        assert.equal(result.caloriesPer100g, 165);
    });

    it('should expose dataType, which distinguishes Foundation from Branded', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('egg-171287'));

        assert.equal(result.dataType, 'SR Legacy');
    });

    it('should request format=full, not format=abridged', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const fetchStub = stub(global, 'fetch').resolves({
            ok: true,
            json: async () => loadFixture('egg-171287'),
        } as Response);

        await this.apolloServer.executeOperation(
            { query: USDA_FOOD_ITEM, variables: { fdcId: 171287 } },
            makeContext(user)
        );

        assert.isTrue(fetchStub.calledOnce);
        const url = fetchStub.firstCall.args[0] as string;
        assert.include(url, 'format=full');
        assert.notInclude(url, 'abridged');
    });

    it('should extract macros unchanged under format=full', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // Full-format entries nest the id under `nutrient.id` rather than `nutrientId`.
        const result = await fetchItem(this.apolloServer, user, loadFixture('egg-171287'));

        assert.equal(result.caloriesPer100g, 143);
        assert.equal(result.proteinPer100g, 12.56);
        assert.equal(result.carbsPer100g, 0.72);
        assert.equal(result.fatPer100g, 9.51);
    });

    it('should return egg portions sorted by sequence number', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('egg-171287'));
        const portions: Portion[] = result.portions;

        assert.equal(portions.length, 6);
        assert.deepEqual(
            portions.map((p) => p.description),
            [
                '1 small',
                '1 medium',
                '1 large',
                '1 extra large',
                '1 jumbo',
                '1 cup (4.86 large eggs)',
            ]
        );

        const large = portionByDescription(portions, '1 large');
        assert.equal(large.gramWeight, 50);
        assert.isNull(large.millilitres);
        assert.isNull(large.impliedDensity);
        assert.isFalse(large.ambiguous);
    });

    it('should flag "cup (4.86 large eggs)" as ambiguous and never as an item', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('egg-171287'));
        const portions: Portion[] = result.portions;

        const cup = portionByDescription(portions, '1 cup (4.86 large eggs)');
        assert.isTrue(cup.ambiguous);
        // VOLUME, so it can never reach the perUnit path and overstate one egg fivefold.
        assert.equal(cup.kind, 'VOLUME');

        const items = portions.filter((p) => p.kind === 'ITEM');
        assert.equal(items.length, 5);
    });

    it('should derive a consistent density from both olive oil portions', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('olive-oil-171413'));
        const portions: Portion[] = result.portions;

        const cup = portionByDescription(portions, '1 cup');
        const tbsp = portionByDescription(portions, '1 tablespoon');
        assert.closeTo(cup.impliedDensity!, 0.913, 0.001);
        assert.closeTo(tbsp.impliedDensity!, 0.913, 0.001);
    });

    it('should use the US customary cup of 236.588 ml', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('olive-oil-171413'));

        const cup = portionByDescription(result.portions, '1 cup');
        assert.equal(cup.millilitres, 236.588);
    });

    it('should derive the reference density for all-purpose flour', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('flour-168894'));

        const cup = portionByDescription(result.portions, '1 cup');
        assert.closeTo(cup.impliedDensity!, 0.528, 0.001);
    });

    it('should report no item portions for a volume-only food', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('olive-oil-171413'));
        const portions: Portion[] = result.portions;

        assert.equal(portions.length, 2);
        assert.isTrue(portions.every((p) => p.kind === 'VOLUME'));
        // The "no per-item portion" path the client must handle explicitly.
        assert.deepEqual(
            portions.filter((p) => p.kind === 'ITEM'),
            []
        );
    });

    it('should classify a RACC portion as SERVING, not ITEM', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('garlic-1104647'));
        const portions: Portion[] = result.portions;

        assert.equal(portions.length, 1);
        assert.equal(portions[0].gramWeight, 85);
        // 85 g is roughly 28 cloves. Read as "1 garlic" it is wrong by an order of magnitude.
        assert.equal(portions[0].kind, 'SERVING');
        assert.deepEqual(
            portions.filter((p) => p.kind === 'ITEM'),
            []
        );
    });

    it('should flag an NLEA serving as ambiguous', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('banana-173944'));

        const nlea = portionByDescription(result.portions, '1 NLEA serving');
        assert.isTrue(nlea.ambiguous);
    });

    it('should flag a "yields" portion as ambiguous', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('lemon-juice-167747'));

        // The juice from a lemon, not a lemon.
        const yields = portionByDescription(result.portions, '1 lemon yields');
        assert.isTrue(yields.ambiguous);
    });

    it('should classify a slice as an ambiguous ITEM and an ounce as WEIGHT', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('carrot-170393'));
        const portions: Portion[] = result.portions;

        const slice = portionByDescription(portions, '1 slice');
        assert.equal(slice.kind, 'ITEM');
        assert.isTrue(slice.ambiguous);

        const medium = portionByDescription(portions, '1 medium');
        assert.equal(medium.kind, 'ITEM');
        assert.isFalse(medium.ambiguous);

        // Redundant with perGram, so offered as neither a perUnit nor a density source.
        assert.equal(portionByDescription(portions, '1 oz').kind, 'WEIGHT');
    });

    it('should use portionDescription, not the numeric FNDDS modifier code, for the label', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('anchovy-2706232'));
        const portions: Portion[] = result.portions;

        assert.equal(portions.length, 3);
        assert.deepEqual(
            portions.map((p) => p.description),
            ['1 can', '1 anchovy', 'Quantity not specified']
        );
        // The raw numeric code stays on `modifier`, it just must not leak into the label.
        assert.equal(portionByDescription(portions, '1 anchovy').modifier, '60316');
    });

    it('should classify FNDDS "Quantity not specified" as SERVING, not ITEM', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('anchovy-2706232'));
        const portions: Portion[] = result.portions;

        const notSpecified = portionByDescription(portions, 'Quantity not specified');
        assert.equal(notSpecified.kind, 'SERVING');
        assert.deepEqual(
            portions.filter((p) => p.kind === 'ITEM').map((p) => p.description),
            ['1 can', '1 anchovy']
        );
    });

    it('should build one SERVING portion from a branded servingSize', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('branded-2340821'));
        const portions: Portion[] = result.portions;

        assert.equal(result.servingSize, 17);
        assert.equal(result.servingSizeUnit, 'g');
        assert.equal(result.householdServingFullText, '1 Tbsp');
        assert.equal(portions.length, 1);
        assert.equal(portions[0].gramWeight, 17);
        // A serving is not necessarily one item, so it is never offered for perUnit.
        assert.equal(portions[0].kind, 'SERVING');
    });

    it('should return an empty portion list when the item has no portion data', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('no-portions-171077'));

        assert.deepEqual(result.portions, []);
    });

    it('should classify every known volume unit as VOLUME', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // A gap in the table silently promotes a volume word to ITEM, so loop the
        // whole table rather than spot-checking a few keys.
        const units = Object.keys(__testables.VOLUME_ML);
        const item = {
            fdcId: 999999,
            description: 'Synthetic volume unit coverage',
            foodNutrients: [],
            foodPortions: units.map((modifier, i) => ({
                amount: 1.0,
                modifier,
                gramWeight: 10.0,
                sequenceNumber: i + 1,
                measureUnit: { id: 9999, name: 'undetermined' },
            })),
        };

        const result = await fetchItem(this.apolloServer, user, item);
        const portions: Portion[] = result.portions;

        assert.equal(portions.length, units.length);
        for (const portion of portions) {
            assert.equal(portion.kind, 'VOLUME', `"${portion.modifier}" should be VOLUME`);
            assert.isNotNull(portion.millilitres);
            assert.isNotNull(portion.impliedDensity);
        }
    });

    it('should return null millilitres for an unrecognised modifier', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const result = await fetchItem(this.apolloServer, user, loadFixture('egg-171287'));

        // Not an error: "1 large" carries no volume information at all.
        const large = portionByDescription(result.portions, '1 large');
        assert.equal(large.kind, 'ITEM');
        assert.isNull(large.millilitres);
        assert.isNull(large.impliedDensity);
    });

    it('should derive densities without reading Unit or UnitConversion', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        // This is the state of the production database: populateUnits() creates no
        // conversions, so a measureType-based lookup would return nothing at all.
        assert.equal(await Unit.countDocuments(), 0);
        assert.equal(await UnitConversion.countDocuments(), 0);

        const result = await fetchItem(this.apolloServer, user, loadFixture('olive-oil-171413'));

        assert.closeTo(
            portionByDescription(result.portions, '1 cup').impliedDensity!,
            0.913,
            0.001
        );
    });
});
