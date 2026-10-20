import { readdirSync } from 'node:fs';

import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { useTestEnvironment } from '../helpers/env.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import type { OpenFoodFactsProduct } from '../../src/lib/types.js';
import { EACH, INGREDIENTS, MEASURE_COMPONENTS } from '../helpers/fixtures.js';
import { EXISTING_EGG_INFO, KNORR_POTS, PEARL_COUSCOUS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, openFoodFactsCacheDir, sessionFile } from '../helpers/env.js';

const MUTATIONS = [
    'CliCreateNutritionalInfo',
    'CliUpdateNutritionalInfo',
    'CliCreateIngredientMeasure',
    'CliDeleteIngredientMeasure',
];

function openFoodFactsProduct(product: OpenFoodFactsProduct | null) {
    return {
        data: {
            openFoodFactsProduct: product && { __typename: 'OpenFoodFactsProduct', ...product },
        },
    };
}

function baseApi(
    product: OpenFoodFactsProduct | null = PEARL_COUSCOUS,
    existing: unknown = null
): FakeApi {
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliGetAllIngredients: { data: { ingredientManyAll: INGREDIENTS } },
        CliOpenFoodFactsProduct: openFoodFactsProduct(product),
        CliOpenFoodFactsSearch: { data: { openFoodFactsSearch: [PEARL_COUSCOUS, KNORR_POTS] } },
        CliGetNutritionalInfo: { data: { nutritionalInfoByIngredient: existing } },
        CliCreateNutritionalInfo: (variables) => ({
            data: {
                nutritionalInfoCreateOne: {
                    record: { _id: 'new-1', ...(variables.record as object) },
                },
            },
        }),
        CliUpdateNutritionalInfo: (variables) => ({
            data: {
                nutritionalInfoUpdateById: {
                    record: { _id: 'nut-egg', ...(variables.record as object) },
                },
            },
        }),
        CliGetMeasureComponents: { data: MEASURE_COMPONENTS },
        CliGetIngredientMeasures: { data: { ingredientMeasuresByIngredientIds: [] } },
        CliCreateIngredientMeasure: (variables) => ({
            data: {
                ingredientMeasureCreateOne: {
                    record: { _id: 'meas-1', ...(variables.record as object) },
                },
            },
        }),
    });
}

function json<T = Record<string, unknown>>(
    stdout: string
): { ok: boolean; data: T; error: { code: string; message: string }; warnings: string[] } {
    return JSON.parse(stdout);
}

describe('open-food-facts commands', () => {
    let api: FakeApi;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
    });
    afterEach(() => {
        api?.restore();
        cleanTestEnvironment();
        process.exitCode = 0;
    });

    describe('open-food-facts show', () => {
        it('shows the product, its macros and its pack', async () => {
            api = baseApi();
            api.install();
            const { stdout } = await runCommand(['open-food-facts', 'show', '5010338301255'], ROOT);
            expect(stdout).to.contain("Al'fez · Pearl Couscous (5010338301255)");
            expect(stdout).to.contain('Per 100 g: 362.0 kcal');
            expect(stdout).to.contain('Pack: 200g');
            expect(stdout).to.contain('Sold in the UK: yes');
            expect(api.operations).to.deep.equal(['CliOpenFoodFactsProduct']);
        });

        it('reads a product once, then from the disk cache', async () => {
            api = baseApi();
            api.install();
            await runCommand(['open-food-facts', 'show', '5010338301255', '--json'], ROOT);
            const { stdout } = await runCommand(
                ['open-food-facts', 'show', '5010338301255', '--json'],
                ROOT
            );
            expect(api.countOf('CliOpenFoodFactsProduct')).to.equal(1);
            expect(json<{ fromCache: boolean }>(stdout).data.fromCache).to.equal(true);
            expect(readdirSync(openFoodFactsCacheDir())).to.have.lengthOf(1);
        });

        it('warns about a check digit that fails, and still looks the code up', async () => {
            api = baseApi(KNORR_POTS);
            api.install();
            const { stdout } = await runCommand(
                ['open-food-facts', 'show', '11213606', '--json'],
                ROOT
            );
            const payload = json(stdout);
            expect(payload.ok).to.equal(true);
            expect(payload.warnings.join(' ')).to.contain('fails the barcode check digit');
        });

        it('passes on the data warnings that the API reports', async () => {
            api = baseApi({ ...PEARL_COUSCOUS, warnings: ['No value for kcal'] });
            api.install();
            const { stdout } = await runCommand(
                ['open-food-facts', 'show', '5010338301255', '--json'],
                ROOT
            );
            expect(json(stdout).warnings).to.deep.equal(['No value for kcal']);
        });

        it('exits 4 for an unknown barcode', async () => {
            api = baseApi();
            api.on('CliOpenFoodFactsProduct', {
                errors: [{ message: 'No product', extensions: { code: 'NOT_FOUND' } }],
            });
            api.install();
            const { error } = await runCommand(['open-food-facts', 'show', '5000000000000'], ROOT);
            expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
        });
    });

    describe('open-food-facts search', () => {
        it('searches UK products by default', async () => {
            api = baseApi();
            api.install();
            const { stdout } = await runCommand(
                ['open-food-facts', 'search', '"pearl couscous"'],
                ROOT
            );
            expect(api.requests[0].variables).to.deep.equal({
                query: 'pearl couscous',
                pageSize: 20,
                ukOnly: true,
            });
            expect(stdout).to.contain('5010338301255');
            expect(stdout).to.contain('8×24 g');
        });

        it('searches every country with --all-countries, and caps the page size', async () => {
            api = baseApi();
            api.install();
            await runCommand(
                ['open-food-facts', 'search', 'couscous', '--all-countries', '--page-size', '500'],
                ROOT
            );
            expect(api.requests[0].variables).to.deep.equal({
                query: 'couscous',
                pageSize: 50,
                ukOnly: false,
            });
        });
    });

    describe('nutrition link --barcode', () => {
        function nutritionRecord(): Record<string, unknown> | undefined {
            return api.requests.find((r) =>
                ['CliCreateNutritionalInfo', 'CliUpdateNutritionalInfo'].includes(r.operation)
            )?.variables.record as Record<string, unknown> | undefined;
        }

        it('writes the Open Food Facts source, its barcode and the product name', async () => {
            api = baseApi();
            api.install();
            await runCommand(
                ['nutrition', 'link', '"olive oil"', '--barcode', '5010338301255'],
                ROOT
            );
            expect(nutritionRecord()).to.deep.equal({
                ingredient: 'ing-oil',
                source: 'openFoodFacts',
                usdaFdcId: null,
                openFoodFactsBarcode: '5010338301255',
                sourceName: "Al'fez · Pearl Couscous",
                perGram: { calories: 3.62, protein: 0.12, carbs: 0.72, fat: 0.015 },
            });
        });

        it('stores a multipack item as an each measure', async () => {
            api = baseApi(KNORR_POTS);
            api.install();
            const { stdout } = await runCommand(
                ['nutrition', 'link', '"olive oil"', '--barcode', '11213606', '--portion', '1'],
                ROOT
            );
            const measure = api.requests.find((r) => r.operation === 'CliCreateIngredientMeasure')
                ?.variables.record as Record<string, unknown>;
            expect(measure).to.deep.equal({
                ingredient: 'ing-oil',
                unit: EACH._id,
                size: null,
                prepMethod: null,
                grams: 24,
            });
            expect(stdout).to.contain('1 each = 24.0 g');
        });

        it('switches a USDA link to Open Food Facts under --overwrite, clearing the USDA id', async () => {
            api = baseApi(PEARL_COUSCOUS, EXISTING_EGG_INFO);
            api.install();
            const { stdout } = await runCommand(
                ['nutrition', 'link', 'egg', '--barcode', '5010338301255', '--overwrite'],
                ROOT
            );
            expect(api.countOf('CliUpdateNutritionalInfo')).to.equal(1);
            expect(nutritionRecord()).to.include({
                source: 'openFoodFacts',
                usdaFdcId: null,
                openFoodFactsBarcode: '5010338301255',
            });
            expect(stdout).to.contain('Previous values');
            expect(stdout).to.contain('USDA 171287');
        });

        it('names the existing source when it refuses to overwrite', async () => {
            api = baseApi(PEARL_COUSCOUS, EXISTING_EGG_INFO);
            api.install();
            const { error } = await runCommand(
                ['nutrition', 'link', 'egg', '--barcode', '5010338301255'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.WOULD_OVERWRITE);
            expect(error?.message).to.contain('(USDA 171287)');
            expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
        });

        it('passes on data warnings, and sends nothing under --dry-run', async () => {
            api = baseApi({ ...PEARL_COUSCOUS, warnings: ['No value for kcal'] });
            api.install();
            const { stdout } = await runCommand(
                [
                    'nutrition',
                    'link',
                    '"olive oil"',
                    '--barcode',
                    '5010338301255',
                    '--dry-run',
                    '--json',
                ],
                ROOT
            );
            const payload = json<{ item: { source: string; id: string } }>(stdout);
            expect(payload.data.item).to.include({ source: 'openFoodFacts', id: '5010338301255' });
            expect(payload.warnings).to.include(
                'Open Food Facts 5010338301255: No value for kcal.'
            );
            expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
        });

        it('refuses both --fdc-id and --barcode, and neither, before any request', async () => {
            api = baseApi();
            api.install();
            const both = await runCommand(
                ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--barcode', '5010338301255'],
                ROOT
            );
            expect(both.error?.oclif?.exit).to.equal(2);
            const neither = await runCommand(['nutrition', 'link', 'egg'], ROOT);
            expect(neither.error?.oclif?.exit).to.equal(2);
            expect(api.requests).to.deep.equal([]);
        });
    });

    describe('nutrition link --label-per-100g', () => {
        /** A stub record with no values, as Knorr's roasted garlic pot was. */
        const STUB: OpenFoodFactsProduct = {
            ...KNORR_POTS,
            caloriesPer100g: null,
            proteinPer100g: null,
            carbsPer100g: null,
            fatPer100g: null,
            warnings: ['No value for kcal, protein, carbs, fat'],
        };

        it('writes the label values, and keeps the barcode and the portions', async () => {
            api = baseApi(STUB);
            api.install();
            const { stdout } = await runCommand(
                [
                    'nutrition',
                    'link',
                    '"olive oil"',
                    '--barcode',
                    '11213606',
                    '--label-per-100g',
                    '69,3.8,12,0.5',
                    '--portion',
                    '1',
                    '--json',
                ],
                ROOT
            );
            const payload = json(stdout);
            const record = api.requests.find((r) => r.operation === 'CliCreateNutritionalInfo')
                ?.variables.record as Record<string, unknown>;
            expect(record).to.include({
                source: 'openFoodFacts',
                openFoodFactsBarcode: '11213606',
            });
            expect(record.perGram).to.deep.equal({
                calories: 0.69,
                protein: 0.038,
                carbs: 0.12,
                fat: 0.005,
            });
            expect(api.countOf('CliCreateIngredientMeasure')).to.equal(1);
            // The record's data warnings and missing macros no longer apply.
            expect(payload.warnings.join(' ')).to.not.contain('No value');
            expect(payload.warnings.join(' ')).to.not.contain('written as zero');
        });

        it('shows the label beside the record in a dry run, and marks each difference', async () => {
            api = baseApi();
            api.install();
            const { stdout } = await runCommand(
                [
                    'nutrition',
                    'link',
                    '"olive oil"',
                    '--barcode',
                    '5010338301255',
                    '--label-per-100g',
                    '362,12,70,1.5',
                    '--dry-run',
                ],
                ROOT
            );
            expect(stdout).to.contain('Per 100 g from the label, replacing the record:');
            expect(stdout).to.match(/carbs\s+70\.0\s+72\.0\s+← differs/);
            expect(stdout).to.not.match(/kcal\s+362\.0\s+362\.0\s+← differs/);
            expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
        });

        it('warns when the label kcal does not match its macros', async () => {
            api = baseApi();
            api.install();
            const { stdout } = await runCommand(
                [
                    'nutrition',
                    'link',
                    '"olive oil"',
                    '--barcode',
                    '5010338301255',
                    '--label-per-100g',
                    // Fat typed as 15 instead of 1.5.
                    '362,12,72,15',
                    '--dry-run',
                    '--json',
                ],
                ROOT
            );
            expect(json(stdout).warnings.join(' ')).to.contain('Check the order of the values');
        });

        it('refuses values that are not four numbers, before any request', async () => {
            api = baseApi();
            api.install();
            const { error } = await runCommand(
                [
                    'nutrition',
                    'link',
                    '"olive oil"',
                    '--barcode',
                    '5010338301255',
                    '--label-per-100g',
                    '362,12,72',
                ],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(api.requests).to.deep.equal([]);
        });
    });
});
