import { readFileSync } from 'fs';

import { assert } from 'chai';
import mongoose from 'mongoose';
import { restore, stub } from 'sinon';
import { ApolloServer } from '@apollo/server';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { MappedPortion } from '../../src/schema/Usda.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { resetRateLimits } from '../../src/middleware/rateLimit.js';
import { createUnverifiedUser, createUser } from '../utils/data.js';
import { resetOpenFoodFacts } from '../../src/schema/OpenFoodFacts.js';
import { OPEN_FOOD_FACTS_SEARCH_PER_MINUTE } from '../../src/schema/OpenFoodFacts.js';
import { OPEN_FOOD_FACTS_PRODUCT_PER_MINUTE, mapProduct } from '../../src/schema/OpenFoodFacts.js';

const PRODUCT_FIELDS = `
            barcode
            name
            brands
            quantity
            servingSize
            countries
            caloriesPer100g
            proteinPer100g
            carbsPer100g
            fatPer100g
            warnings
            portions {
                description
                amount
                gramWeight
                kind
                millilitres
                ambiguous
            }`;

const OPEN_FOOD_FACTS_PRODUCT = `
    query OpenFoodFactsProduct($barcode: String!) {
        openFoodFactsProduct(barcode: $barcode) {
${PRODUCT_FIELDS}
        }
    }`;

const OPEN_FOOD_FACTS_SEARCH = `
    query OpenFoodFactsSearch($query: String!, $pageSize: Int, $ukOnly: Boolean) {
        openFoodFactsSearch(query: $query, pageSize: $pageSize, ukOnly: $ukOnly) {
${PRODUCT_FIELDS}
        }
    }`;

interface OpenFoodFactsProductResult {
    barcode: string;
    name: string | null;
    brands: string | null;
    quantity: string | null;
    servingSize: string | null;
    countries: string[];
    caloriesPer100g: number | null;
    proteinPer100g: number | null;
    carbsPer100g: number | null;
    fatPer100g: number | null;
    warnings: string[];
    portions: Pick<
        MappedPortion,
        'description' | 'amount' | 'gramWeight' | 'kind' | 'millilitres' | 'ambiguous'
    >[];
}

/** Fixtures are trimmed real Open Food Facts responses. They live in the source tree,
 *  not in dist/, so resolve them relative to the compiled test's own URL. */
function loadFixture(name: string): Record<string, unknown> {
    const url = new URL(`../../../test/fixtures/open-food-facts/${name}.json`, import.meta.url);
    return JSON.parse(readFileSync(url, 'utf-8'));
}

function productOf(name: string): Record<string, unknown> {
    return loadFixture(name)['product'] as Record<string, unknown>;
}

function respond(json: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 404 ? 'Not Found' : 'OK',
        json: async () => json,
    } as Response;
}

function makeContext(user: User | null) {
    return {
        contextValue: {
            isAuthenticated: () => !!user,
            getUser: () => user,
        },
    };
}

function dropUsers(done: Mocha.Done) {
    const users = mongoose.connection.collections['users'];
    (users ? users.drop() : Promise.resolve(true))
        .then(() => done())
        .catch((error) => {
            console.log(error);
            assert.fail('Collections not deleted');
        });
}

// ---------- mapping ----------

describe('Open Food Facts product mapping', function () {
    it('should map macros, brands and the pack size', function () {
        const product = mapProduct(productOf('pearl-couscous-5010338301255'));
        assert.equal(product.barcode, '5010338301255');
        assert.equal(product.name, 'Pearl Couscous');
        assert.equal(product.brands, "Al'fez");
        assert.equal(product.quantity, '200g');
        assert.equal(product.caloriesPer100g, 362);
        assert.equal(product.proteinPer100g, 12);
        assert.equal(product.carbsPer100g, 72);
        assert.equal(product.fatPer100g, 1.5);
        assert.include(product.countries, 'en:united-kingdom');
        assert.deepEqual(product.warnings, []);
        // A single pack is not one item of the ingredient, and there is no serving.
        assert.deepEqual(product.portions, []);
    });

    it('should read a household serving as a volume portion', function () {
        const product = mapProduct(productOf('tajin-0633148100013'));
        // An empty product name is no name.
        assert.isNull(product.name);
        assert.equal(product.servingSize, '0.25 tsp (1 g)');
        assert.lengthOf(product.portions, 1);
        const [portion] = product.portions;
        assert.equal(portion.description, '0.25 tsp');
        assert.equal(portion.kind, 'VOLUME');
        assert.equal(portion.gramWeight, 1);
        assert.closeTo(portion.millilitres!, 1.232, 0.001);
        // A quarter teaspoon is not one unit.
        assert.isTrue(portion.ambiguous);
    });

    it('should not make a portion from a serving that is only a weight', function () {
        const product = mapProduct(productOf('engevita-5016081312098'));
        assert.equal(product.servingSize, '5 g');
        assert.deepEqual(product.portions, []);
    });

    it('should read one item from a multipack quantity', function () {
        const product = mapProduct(productOf('knorr-marmite-11213606'));
        // The serving is "28g", a plain weight; only the pack names an item.
        assert.lengthOf(product.portions, 1);
        const [portion] = product.portions;
        assert.equal(portion.description, '1 each (pack of 8×24 g)');
        assert.equal(portion.kind, 'ITEM');
        assert.equal(portion.gramWeight, 24);
        assert.equal(portion.amount, 1);
    });

    it('should flag an item serving, which is not always one item', function () {
        const product = mapProduct({
            code: '5000000000001',
            serving_size: '1 pot (28 g)',
            serving_quantity: 28,
            nutriments: {},
        });
        assert.lengthOf(product.portions, 1);
        assert.equal(product.portions[0].kind, 'ITEM');
        assert.equal(product.portions[0].gramWeight, 28);
        assert.isTrue(product.portions[0].ambiguous);
    });

    it('should read "1 portion" as a serving, not an item', function () {
        const product = mapProduct({
            code: '5000000000001',
            serving_size: '1 portion (5 g)',
            serving_quantity: 5,
            nutriments: {},
        });
        assert.equal(product.portions[0].kind, 'SERVING');
    });

    it('should not make a portion from a serving measured in millilitres', function () {
        const product = mapProduct({
            code: '5000000000001',
            serving_size: '1 tbsp (15 ml)',
            serving_quantity: 15,
            serving_quantity_unit: 'ml',
            nutriments: {},
        });
        assert.deepEqual(product.portions, []);
    });

    it('should warn about a missing macro', function () {
        const product = mapProduct({
            code: '5000000000001',
            nutriments: { proteins_100g: 3, carbohydrates_100g: 10, fat_100g: 1 },
        });
        assert.isNull(product.caloriesPer100g);
        assert.deepEqual(product.warnings, ['No value for kcal']);
    });

    it('should warn when the kcal does not match the macros', function () {
        const product = mapProduct({
            code: '5000000000001',
            nutriments: {
                'energy-kcal_100g': 200,
                proteins_100g: 0,
                carbohydrates_100g: 0,
                fat_100g: 0,
            },
        });
        assert.deepEqual(product.warnings, ['200 kcal does not match the macros (about 0 kcal)']);
    });

    it('should join the brand list that search hits carry', function () {
        const product = mapProduct({ code: '5000000000001', brands: ['Unilever', 'Knorr'] });
        assert.equal(product.brands, 'Unilever, Knorr');
    });
});

// ---------- resolvers (mock fetch) ----------

describe('openFoodFactsProduct', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        resetRateLimits();
        resetOpenFoodFacts();
        await createUser();
    });
    afterEach(function (done) {
        restore();
        dropUsers(done);
    });

    it('should return the mapped product and name the client', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const fetchStub = stub(global, 'fetch').resolves(
            respond(loadFixture('pearl-couscous-5010338301255'))
        );

        const response = await this.apolloServer.executeOperation(
            { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode: '5010338301255' } },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const product = (
            response.body.singleResult.data as { openFoodFactsProduct: OpenFoodFactsProductResult }
        ).openFoodFactsProduct;
        assert.equal(product.name, 'Pearl Couscous');
        assert.equal(product.caloriesPer100g, 362);

        const [url, init] = fetchStub.firstCall.args as [string, RequestInit];
        assert.include(url, '/api/v3/product/5010338301255?fields=');
        const headers = init.headers as Record<string, string>;
        assert.match(headers['User-Agent'], /^recipe\/\S+ \(.+\)$/);
    });

    it('should serve a repeated barcode from the cache', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const fetchStub = stub(global, 'fetch').resolves(
            respond(loadFixture('pearl-couscous-5010338301255'))
        );

        for (let i = 0; i < 2; i++) {
            const response = await this.apolloServer.executeOperation(
                { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode: '5010338301255' } },
                makeContext(user)
            );
            assert.equal(response.body.kind, 'single');
            assert.isUndefined(response.body.singleResult.errors);
        }
        assert.equal(fetchStub.callCount, 1);
    });

    it('should report an unknown barcode as NOT_FOUND', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        stub(global, 'fetch').resolves(
            respond(
                {
                    code: '5000000000000',
                    result: { id: 'product_not_found' },
                    status: 'failure',
                },
                404
            )
        );

        const response = await this.apolloServer.executeOperation(
            { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode: '5000000000000' } },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.equal(response.body.singleResult.errors?.[0].extensions?.code, 'NOT_FOUND');
    });

    it('should refuse a value that is not a barcode, before any request', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const fetchStub = stub(global, 'fetch');

        for (const barcode of ['12345', 'abc5010338301255', '501033830125x', '../search']) {
            const response = await this.apolloServer.executeOperation(
                { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode } },
                makeContext(user)
            );
            assert.equal(response.body.kind, 'single');
            assert.equal(
                response.body.singleResult.errors?.[0].extensions?.code,
                'BAD_USER_INPUT',
                barcode
            );
        }
        assert.isFalse(fetchStub.called);
    });

    it('should report a server error from Open Food Facts', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        stub(global, 'fetch').resolves({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            json: async () => ({}),
        } as Response);

        const response = await this.apolloServer.executeOperation(
            { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode: '5010338301255' } },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.equal(
            response.body.singleResult.errors?.[0].message,
            'Open Food Facts error: 503 Service Unavailable'
        );
    });

    it('should explain a request that timed out', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        stub(global, 'fetch').rejects(new DOMException('This operation was aborted', 'AbortError'));

        const response = await this.apolloServer.executeOperation(
            { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode: '5010338301255' } },
            makeContext(user)
        );
        assert.equal(response.body.kind, 'single');
        assert.equal(
            response.body.singleResult.errors?.[0].message,
            'The Open Food Facts service took too long to respond. Try again.'
        );
    });

    it('should fail for an unauthenticated user', async function () {
        const fetchStub = stub(global, 'fetch');

        const response = await this.apolloServer.executeOperation(
            { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode: '5010338301255' } },
            makeContext(null)
        );
        assert.equal(response.body.kind, 'single');
        assert.equal(response.body.singleResult.errors?.[0].extensions?.code, 'UNAUTHENTICATED');
        assert.isFalse(fetchStub.called);
    });

    it('should fail for an unverified user', async function () {
        const unverified = await createUnverifiedUser();
        const fetchStub = stub(global, 'fetch');

        const response = await this.apolloServer.executeOperation(
            { query: OPEN_FOOD_FACTS_PRODUCT, variables: { barcode: '5010338301255' } },
            makeContext(unverified)
        );
        assert.equal(response.body.kind, 'single');
        assert.equal(response.body.singleResult.errors?.[0].extensions?.code, 'FORBIDDEN');
        assert.isFalse(fetchStub.called);
    });

    it('should hold the whole server below the Open Food Facts limit', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const fetchStub = stub(global, 'fetch').resolves(
            respond(loadFixture('pearl-couscous-5010338301255'))
        );

        let limited: { extensions?: { code?: unknown } } | undefined;
        // Distinct barcodes, so that the cache does not answer.
        for (let i = 0; i <= OPEN_FOOD_FACTS_PRODUCT_PER_MINUTE; i++) {
            const response = await this.apolloServer.executeOperation(
                {
                    query: OPEN_FOOD_FACTS_PRODUCT,
                    variables: { barcode: String(50103383000000 + i) },
                },
                makeContext(user)
            );
            assert.equal(response.body.kind, 'single');
            if (response.body.singleResult.errors) {
                limited = response.body.singleResult.errors[0];
                break;
            }
        }
        assert.isDefined(limited, 'The server should stop within the minute');
        assert.equal(limited!.extensions!.code, 'RATE_LIMITED');
        assert.equal(fetchStub.callCount, OPEN_FOOD_FACTS_PRODUCT_PER_MINUTE);
    });
});

describe('openFoodFactsSearch', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        resetRateLimits();
        resetOpenFoodFacts();
        await createUser();
    });
    afterEach(function (done) {
        restore();
        dropUsers(done);
    });

    /** Runs openFoodFactsSearch and returns its single result. */
    async function search(server: ApolloServer, variables: Record<string, unknown>) {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const response = await server.executeOperation(
            { query: OPEN_FOOD_FACTS_SEARCH, variables },
            makeContext(user)
        );
        if (response.body.kind !== 'single') {
            assert.fail('Expected a single result');
        }
        return response.body.singleResult;
    }

    it('should return mapped hits filtered to UK products', async function () {
        const fetchStub = stub(global, 'fetch').resolves(
            respond(loadFixture('search-pearl-couscous'))
        );

        const result = await search(this.apolloServer, { query: 'pearl couscous' });
        assert.isUndefined(result.errors);
        const hits = (result.data as { openFoodFactsSearch: OpenFoodFactsProductResult[] })
            .openFoodFactsSearch;
        assert.lengthOf(hits, 5);
        assert.equal(hits[0].barcode, '5010338301255');
        assert.equal(hits[0].brands, "Al'fez");
        // A hit with no kcal carries a warning, not an error.
        assert.deepEqual(hits[4].warnings, ['No value for kcal']);

        const url = new URL(fetchStub.firstCall.args[0] as string);
        assert.equal(url.pathname, '/search');
        assert.equal(
            url.searchParams.get('q'),
            'pearl couscous countries_tags:"en:united-kingdom"'
        );
    });

    it('should search every country when asked', async function () {
        const fetchStub = stub(global, 'fetch').resolves(respond({ hits: [] }));

        await search(this.apolloServer, { query: 'pearl couscous', ukOnly: false });
        const url = new URL(fetchStub.firstCall.args[0] as string);
        assert.equal(url.searchParams.get('q'), 'pearl couscous');
    });

    it('should clamp the page size', async function () {
        const fetchStub = stub(global, 'fetch').resolves(respond({ hits: [] }));

        await search(this.apolloServer, { query: 'couscous', pageSize: 1000 });
        const url = new URL(fetchStub.firstCall.args[0] as string);
        assert.equal(url.searchParams.get('page_size'), '50');
    });

    it('should serve a repeated search from the cache', async function () {
        const fetchStub = stub(global, 'fetch').resolves(
            respond(loadFixture('search-pearl-couscous'))
        );

        await search(this.apolloServer, { query: 'pearl couscous' });
        await search(this.apolloServer, { query: 'Pearl Couscous ' });
        assert.equal(fetchStub.callCount, 1);
    });

    it('should hold the whole server below the search limit', async function () {
        const fetchStub = stub(global, 'fetch').resolves(respond({ hits: [] }));

        let code: unknown;
        for (let i = 0; i <= OPEN_FOOD_FACTS_SEARCH_PER_MINUTE; i++) {
            const result = await search(this.apolloServer, { query: `couscous ${i}` });
            code = result.errors?.[0].extensions?.code;
            if (code) break;
        }
        assert.equal(code, 'RATE_LIMITED');
        assert.equal(fetchStub.callCount, OPEN_FOOD_FACTS_SEARCH_PER_MINUTE);
    });
});
