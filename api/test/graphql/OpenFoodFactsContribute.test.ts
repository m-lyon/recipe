import { Readable } from 'stream';

import { assert } from 'chai';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { SinonStub, restore, stub } from 'sinon';
import Upload from 'graphql-upload/Upload.mjs';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { resetRateLimits } from '../../src/middleware/rateLimit.js';
import { createUnverifiedUser, createUser } from '../utils/data.js';
import { resetOpenFoodFacts } from '../../src/schema/OpenFoodFacts.js';
import { appUuid, productFields } from '../../src/schema/OpenFoodFactsContribute.js';

const CONTRIBUTE = `
    mutation Contribute($input: OpenFoodFactsContributionInput!, $labelPhoto: Upload) {
        openFoodFactsContribute(input: $input, labelPhoto: $labelPhoto) {
            barcode
            host
            fieldsSent
            photoUploaded
        }
    }`;

const PRODUCT = `
    query Product($barcode: String!) {
        openFoodFactsProduct(barcode: $barcode) { barcode caloriesPer100g }
    }`;

const KNORR = {
    barcode: '8721317714801',
    productName: 'Roasted Garlic Stock Pot',
    brands: 'Knorr',
    quantity: '4 x 26 g',
    per100g: { calories: 69, protein: 3.8, carbs: 12, fat: 0.5 },
};

const ENV = {
    OPEN_FOOD_FACTS_WRITE_URL: 'https://world.openfoodfacts.net',
    OPEN_FOOD_FACTS_USER_ID: 'recipe-app',
    OPEN_FOOD_FACTS_PASSWORD: 'secret-password',
    OPEN_FOOD_FACTS_APP_UUID_SALT: 'salt',
};

function setEnv(values: Partial<typeof ENV>) {
    for (const key of Object.keys(ENV) as Array<keyof typeof ENV>) {
        if (values[key] === undefined) delete process.env[key];
        else process.env[key] = values[key];
    }
}

/** A label photo, as graphql-upload hands it to a resolver. */
function photo(filename: string, content = 'jpeg bytes') {
    const upload = new Upload();
    upload.resolve({
        filename,
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: () => Readable.from([Buffer.from(content)]),
    });
    return upload;
}

function ok(json: unknown) {
    return { ok: true, status: 200, statusText: 'OK', json: async () => json } as Response;
}

const SAVED = ok({ status: 1, status_verbose: 'fields saved' });
const PHOTO_SAVED = ok({ status: 'success', result: { id: 'image_uploaded' } });

function makeContext(user: User | null) {
    return { contextValue: { isAuthenticated: () => !!user, getUser: () => user } };
}

async function contribute(
    server: ApolloServer,
    variables: Record<string, unknown>,
    user?: User | null
) {
    const who = user === undefined ? await User.findOne({ username: 'testuser1' }).orFail() : user;
    const response = await server.executeOperation(
        { query: CONTRIBUTE, variables },
        makeContext(who)
    );
    if (response.body.kind !== 'single') assert.fail('Expected a single result');
    const { data, errors } = response.body.singleResult;
    return {
        errors,
        data: data as { openFoodFactsContribute: ContributionResult } | null | undefined,
    };
}

interface ContributionResult {
    barcode: string;
    host: string;
    fieldsSent: string[];
    photoUploaded: boolean;
}

function formOf(fetchStub: SinonStub, call = 0): URLSearchParams {
    return fetchStub.getCall(call).args[1].body as URLSearchParams;
}

describe('openFoodFactsContribute: request building', function () {
    it('sends the four macros per 100 g with their units', function () {
        assert.deepEqual(productFields({ barcode: '1', per100g: KNORR.per100g }), {
            nutrition_data_per: '100g',
            'nutriment_energy-kcal': '69',
            'nutriment_energy-kcal_unit': 'kcal',
            nutriment_proteins: '3.8',
            nutriment_proteins_unit: 'g',
            nutriment_carbohydrates: '12',
            nutriment_carbohydrates_unit: 'g',
            nutriment_fat: '0.5',
            nutriment_fat_unit: 'g',
        });
    });

    it('sends only the fields given, trimmed', function () {
        assert.deepEqual(productFields({ barcode: '1', brands: ' Knorr ', productName: '' }), {
            brands: 'Knorr',
        });
    });

    it('derives a stable app_uuid that does not show the user id', function () {
        const id = '6586e04c9b1e7c87896b7440';
        const first = appUuid(id, 'salt');
        assert.equal(first, appUuid(id, 'salt'));
        assert.notEqual(first, appUuid(id, 'other salt'));
        assert.notEqual(first, appUuid('6586e04c9b1e7c87896b7441', 'salt'));
        assert.notInclude(first, id);
        assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
});

describe('openFoodFactsContribute', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        resetRateLimits();
        resetOpenFoodFacts();
        setEnv(ENV);
        await createUser();
    });
    afterEach(function (done) {
        restore();
        setEnv({});
        const users = mongoose.connection.collections['users'];
        (users ? users.drop() : Promise.resolve(true)).then(() => done(), done);
    });

    it('sends the product fields and the app account to staging', async function () {
        const fetchStub = stub(global, 'fetch').resolves(SAVED);

        const result = await contribute(this.apolloServer, { input: KNORR });
        assert.isUndefined(result.errors);
        assert.deepEqual(result.data?.openFoodFactsContribute, {
            barcode: '8721317714801',
            host: 'world.openfoodfacts.net',
            fieldsSent: [
                'product_name',
                'brands',
                'quantity',
                'nutrition_data_per',
                'nutriment_energy-kcal',
                'nutriment_energy-kcal_unit',
                'nutriment_proteins',
                'nutriment_proteins_unit',
                'nutriment_carbohydrates',
                'nutriment_carbohydrates_unit',
                'nutriment_fat',
                'nutriment_fat_unit',
            ],
            photoUploaded: false,
        });

        assert.equal(fetchStub.callCount, 1);
        assert.equal(
            fetchStub.firstCall.args[0],
            'https://world.openfoodfacts.net/cgi/product_jqm2.pl'
        );
        const init = fetchStub.firstCall.args[1] as RequestInit;
        assert.equal(init.method, 'POST');
        const form = formOf(fetchStub);
        assert.equal(form.get('code'), '8721317714801');
        assert.equal(form.get('product_name'), 'Roasted Garlic Stock Pot');
        assert.equal(form.get('nutriment_carbohydrates'), '12');
        assert.equal(form.get('user_id'), 'recipe-app');
        assert.equal(form.get('password'), 'secret-password');
        assert.equal(form.get('app_name'), 'recipe');
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        assert.equal(form.get('app_uuid'), appUuid(String(user._id), 'salt'));
        // Staging asks for basic auth.
        const headers = init.headers as Record<string, string>;
        assert.equal(headers.Authorization, `Basic ${Buffer.from('off:off').toString('base64')}`);
        assert.match(headers['User-Agent'], /^recipe\/\S+ \(.+\)$/);
    });

    it('sends no basic auth to production', async function () {
        setEnv({ ...ENV, OPEN_FOOD_FACTS_WRITE_URL: 'https://world.openfoodfacts.org' });
        const fetchStub = stub(global, 'fetch').resolves(SAVED);

        const result = await contribute(this.apolloServer, { input: KNORR });
        assert.equal(result.data?.openFoodFactsContribute.host, 'world.openfoodfacts.org');
        const headers = (fetchStub.firstCall.args[1] as RequestInit).headers as Record<
            string,
            string
        >;
        assert.isUndefined(headers.Authorization);
    });

    it('uploads a label photo after the fields, selected as the nutrition photo', async function () {
        const fetchStub = stub(global, 'fetch');
        fetchStub.onFirstCall().resolves(SAVED);
        fetchStub.onSecondCall().resolves(PHOTO_SAVED);

        const result = await contribute(this.apolloServer, {
            input: KNORR,
            labelPhoto: photo('label.JPG'),
        });
        assert.isUndefined(result.errors);
        assert.isTrue(result.data?.openFoodFactsContribute.photoUploaded);

        assert.equal(
            fetchStub.secondCall.args[0],
            'https://world.openfoodfacts.net/api/v3/product/8721317714801/images'
        );
        const body = JSON.parse((fetchStub.secondCall.args[1] as RequestInit).body as string);
        assert.equal(body.image_data_base64, Buffer.from('jpeg bytes').toString('base64'));
        assert.deepEqual(body.selected, { nutrition: { en: {} } });
        assert.equal(body.user_id, 'recipe-app');
        assert.equal(body.app_name, 'recipe');
    });

    it('sends a photo alone, with no product edit', async function () {
        const fetchStub = stub(global, 'fetch').resolves(PHOTO_SAVED);

        const result = await contribute(this.apolloServer, {
            input: { barcode: KNORR.barcode },
            labelPhoto: photo('label.png'),
        });
        assert.isUndefined(result.errors);
        assert.deepEqual(result.data?.openFoodFactsContribute.fieldsSent, []);
        assert.equal(fetchStub.callCount, 1);
        assert.include(fetchStub.firstCall.args[0] as string, '/images');
    });

    it('refuses a photo that is not an image, before any write', async function () {
        const fetchStub = stub(global, 'fetch');

        const result = await contribute(this.apolloServer, {
            input: KNORR,
            labelPhoto: photo('label.pdf'),
        });
        assert.equal(result.errors?.[0].extensions?.code, 'BAD_USER_INPUT');
        assert.isFalse(fetchStub.called);
    });

    it('refuses a contribution with nothing to send', async function () {
        const fetchStub = stub(global, 'fetch');

        const result = await contribute(this.apolloServer, { input: { barcode: KNORR.barcode } });
        assert.include(result.errors?.[0].message, 'needs a product field');
        assert.isFalse(fetchStub.called);
    });

    it('refuses a value that is not a barcode, and a negative value', async function () {
        const fetchStub = stub(global, 'fetch');

        const badCode = await contribute(this.apolloServer, {
            input: { ...KNORR, barcode: '12345' },
        });
        assert.equal(badCode.errors?.[0].extensions?.code, 'BAD_USER_INPUT');
        const negative = await contribute(this.apolloServer, {
            input: { ...KNORR, per100g: { ...KNORR.per100g, fat: -1 } },
        });
        assert.equal(negative.errors?.[0].extensions?.code, 'BAD_USER_INPUT');
        assert.isFalse(fetchStub.called);
    });

    it('is turned off when the app account is not configured', async function () {
        setEnv({ OPEN_FOOD_FACTS_WRITE_URL: ENV.OPEN_FOOD_FACTS_WRITE_URL });
        const fetchStub = stub(global, 'fetch');

        const result = await contribute(this.apolloServer, { input: KNORR });
        assert.equal(result.errors?.[0].extensions?.code, 'NOT_CONFIGURED');
        assert.isFalse(fetchStub.called);
    });

    it('reports a product edit that Open Food Facts did not save', async function () {
        stub(global, 'fetch').resolves(
            ok({ status: 0, status_verbose: 'no code or invalid code' })
        );

        const result = await contribute(this.apolloServer, { input: KNORR });
        assert.equal(
            result.errors?.[0].message,
            'Open Food Facts did not save the product: no code or invalid code'
        );
    });

    it('says the fields were saved when only the photo failed', async function () {
        const fetchStub = stub(global, 'fetch');
        fetchStub.onFirstCall().resolves(SAVED);
        fetchStub.onSecondCall().resolves(ok({ status: 'failure', errors: ['bad image'] }));

        const result = await contribute(this.apolloServer, {
            input: KNORR,
            labelPhoto: photo('label.jpg'),
        });
        assert.include(result.errors?.[0].message, 'saved the product fields but not the photo');
    });

    it('drops the cached product, so the next read fetches the new values', async function () {
        const user = await User.findOne({ username: 'testuser1' }).orFail();
        const fetchStub = stub(global, 'fetch').callsFake(async (url) =>
            String(url).includes('product_jqm2')
                ? SAVED
                : ok({ status: 'success', product: { code: KNORR.barcode, nutriments: {} } })
        );
        const read = () =>
            this.apolloServer.executeOperation(
                { query: PRODUCT, variables: { barcode: KNORR.barcode } },
                makeContext(user)
            );

        await read();
        await read();
        assert.equal(fetchStub.callCount, 1, 'the second read comes from the cache');
        await contribute(this.apolloServer, { input: KNORR });
        await read();
        assert.equal(fetchStub.callCount, 3, 'the read after the write fetches again');
    });

    it('refuses an unverified user, before any write', async function () {
        const unverified = await createUnverifiedUser();
        const fetchStub = stub(global, 'fetch');

        const result = await contribute(this.apolloServer, { input: KNORR }, unverified);
        assert.equal(result.errors?.[0].extensions?.code, 'FORBIDDEN');
        assert.isFalse(fetchStub.called);
    });
});
