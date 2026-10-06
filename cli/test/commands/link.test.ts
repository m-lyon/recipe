import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { OLIVE_OIL } from '../helpers/fixtures.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { CUP, LARGE, MEASURE_COMPONENTS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';
import { EACH, EGG, EXISTING_EGG_INFO, FLOUR, GARLIC, INGREDIENTS } from '../helpers/fixtures.js';

const MUTATIONS = [
    'CliCreateNutritionalInfo',
    'CliUpdateNutritionalInfo',
    'CliCreateIngredientMeasure',
    'CliDeleteIngredientMeasure',
];

function baseApi(item = EGG, existing: unknown = null, measures: unknown[] = []): FakeApi {
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliGetAllIngredients: { data: { ingredientManyAll: INGREDIENTS } },
        CliUsdaFoodItem: { data: { usdaFoodItem: { __typename: 'UsdaFoodItem', ...item } } },
        CliGetNutritionalInfo: { data: { nutritionalInfoByIngredient: existing } },
        CliCreateNutritionalInfo: (variables) => ({
            data: {
                nutritionalInfoCreateOne: {
                    record: {
                        __typename: 'NutritionalInfo',
                        _id: 'new-1',
                        ...(variables.record as object),
                    },
                },
            },
        }),
        CliUpdateNutritionalInfo: (variables) => ({
            data: {
                nutritionalInfoUpdateById: {
                    record: {
                        __typename: 'NutritionalInfo',
                        _id: 'nut-egg',
                        ...(variables.record as object),
                    },
                },
            },
        }),
        CliGetMeasureComponents: { data: MEASURE_COMPONENTS },
        CliGetIngredientMeasures: { data: { ingredientMeasuresByIngredientIds: measures } },
        CliCreateIngredientMeasure: (variables) => ({
            data: {
                ingredientMeasureCreateOne: {
                    record: {
                        __typename: 'IngredientMeasure',
                        _id: 'meas-1',
                        ...(variables.record as object),
                    },
                },
            },
        }),
        CliDeleteIngredientMeasure: (variables) => ({
            data: { ingredientMeasureRemoveById: { recordId: variables.id } },
        }),
    });
}

/** The output envelope. The caller names the shape of `data` it asserts on. */
function json<T = Record<string, unknown>>(
    stdout: string
): {
    ok: boolean;
    data: T;
    error: {
        code: string;
        message: string;
        existing: { usdaFdcId: number; grams?: number };
    };
    warnings: string[];
} {
    return JSON.parse(stdout);
}

describe('nutrition link', () => {
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

    function measureRecords(): Array<Record<string, unknown>> {
        return api.requests
            .filter((r) => r.operation === 'CliCreateIngredientMeasure')
            .map((r) => r.variables.record as Record<string, unknown>);
    }

    it('writes perGram from the per-100 g values, and nothing else', async () => {
        api = baseApi(OLIVE_OIL);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', '"olive oil"', '--fdc-id', '171413', '--json'],
            ROOT
        );
        const record = api.requests.find((r) => r.operation === 'CliCreateNutritionalInfo')
            ?.variables.record as Record<string, unknown>;
        expect(record).to.deep.equal({
            ingredient: 'ing-oil',
            usdaFdcId: 171413,
            perGram: { calories: 8.84, protein: 0, carbs: 0, fat: 1 },
        });
        expect(measureRecords()).to.deep.equal([]);
        expect(json(stdout).ok).to.equal(true);
    });

    it('stores a portion named by its description as an each + size measure', async () => {
        api = baseApi(EGG);
        api.install();
        await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '"1 large"', '--json'],
            ROOT
        );
        expect(measureRecords()).to.deep.equal([
            { ingredient: 'ing-egg', unit: EACH._id, size: LARGE._id, prepMethod: null, grams: 50 },
        ]);
    });

    it('stores several portions named by index', async () => {
        api = baseApi(OLIVE_OIL);
        api.install();
        await runCommand(
            [
                'nutrition',
                'link',
                '"olive oil"',
                '--fdc-id',
                '171413',
                '--portion',
                '1',
                '--portion',
                '2',
            ],
            ROOT
        );
        // Portion 1 is "1 tablespoon" (13.5 g), portion 2 is "1 cup" (216 g).
        expect(measureRecords().map((r) => r.grams)).to.deep.equal([13.5, 216]);
        expect(measureRecords()[1].unit).to.equal(CUP._id);
    });

    it('stores every mappable portion with --all-portions and warns about the rest', async () => {
        api = baseApi(EGG);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--all-portions', '--json'],
            ROOT
        );
        // Only "1 large" maps: the other sizes are not sizes in this database, and the
        // cup is qualified by "(4.86 large eggs)".
        expect(measureRecords().map((r) => r.grams)).to.deep.equal([50]);
        expect(json(stdout).warnings.join(' ')).to.contain('Skipped portion 1 jumbo');
    });

    it('refuses a portion that maps to nothing, exits 6 and sends no mutation', async () => {
        api = baseApi(GARLIC);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'garlic', '--fdc-id', '1104647', '--portion', '1'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(error?.message).to.contain('a serving size, not one unit');
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
    });

    it('stores "cup, chopped" as a cup + prep method measure', async () => {
        api = baseApi(FLOUR);
        api.install();
        await runCommand(
            ['nutrition', 'link', 'flour', '--fdc-id', '168894', '--portion', '1'],
            ROOT
        );
        expect(measureRecords()).to.deep.equal([
            {
                ingredient: 'ing-flour',
                unit: CUP._id,
                size: null,
                prepMethod: 'prep-chopped',
                grams: 125,
            },
        ]);
    });

    it('warns that storable portions exist but none was chosen', async () => {
        api = baseApi(EGG);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--json'],
            ROOT
        );
        expect(json(stdout).warnings.join(' ')).to.contain('none was chosen');
    });

    it('sends no mutation under --dry-run', async () => {
        api = baseApi(EGG);
        api.install();
        const { stdout } = await runCommand(
            [
                'nutrition',
                'link',
                'egg',
                '--fdc-id',
                '171287',
                '--portion',
                '"1 large"',
                '--dry-run',
                '--json',
            ],
            ROOT
        );
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
        expect(api.countOf('CliUsdaFoodItem')).to.equal(1);
        expect(api.countOf('CliGetNutritionalInfo')).to.equal(1);
        const data = json<{ dryRun: boolean; measures: Array<{ key: string }> }>(stdout).data;
        expect(data.dryRun).to.equal(true);
        expect(data.measures.map((m) => m.key)).to.deep.equal(['each · large']);
    });

    it('exits 5 and sends no mutation when data already exists', async () => {
        api = baseApi(EGG, EXISTING_EGG_INFO);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '"1 large"'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.WOULD_OVERWRITE);
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
    });

    it('reports the conflict under --dry-run rather than a would-be write', async () => {
        api = baseApi(EGG, EXISTING_EGG_INFO);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--dry-run', '--json'],
            ROOT
        );
        expect(json(stdout).error.code).to.equal('WOULD_OVERWRITE');
    });

    it('carries WOULD_OVERWRITE and the existing values in --json mode', async () => {
        api = baseApi(EGG, EXISTING_EGG_INFO);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--json'],
            ROOT
        );
        const payload = json(stdout);
        expect(payload.ok).to.equal(false);
        expect(payload.error.code).to.equal('WOULD_OVERWRITE');
        expect(payload.error.existing.usdaFdcId).to.equal(171287);
    });

    it('exits 5 for a measure with the same key, before any write', async () => {
        const existingMeasure = {
            __typename: 'IngredientMeasure',
            _id: 'meas-old',
            ingredient: 'ing-egg',
            grams: 57,
            unit: EACH,
            size: LARGE,
            prepMethod: null,
        };
        api = baseApi(EGG, null, [existingMeasure]);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '"1 large"'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.WOULD_OVERWRITE);
        expect(error?.message).to.contain('each · large');
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
    });

    it('replaces the record and a same-key measure with --overwrite', async () => {
        const existingMeasure = {
            __typename: 'IngredientMeasure',
            _id: 'meas-old',
            ingredient: 'ing-egg',
            grams: 57,
            unit: EACH,
            size: LARGE,
            prepMethod: null,
        };
        api = baseApi(EGG, EXISTING_EGG_INFO, [existingMeasure]);
        api.install();
        const { stdout } = await runCommand(
            [
                'nutrition',
                'link',
                'egg',
                '--fdc-id',
                '171287',
                '--portion',
                '"1 large"',
                '--overwrite',
            ],
            ROOT
        );
        expect(api.countOf('CliUpdateNutritionalInfo')).to.equal(1);
        expect(api.countOf('CliCreateNutritionalInfo')).to.equal(0);
        expect(
            api.requests.find((r) => r.operation === 'CliDeleteIngredientMeasure')?.variables
        ).to.deep.equal({
            id: 'meas-old',
        });
        expect(api.countOf('CliCreateIngredientMeasure')).to.equal(1);
        expect(stdout).to.contain('Previous values');
        expect(stdout).to.contain('replacing 57.0 g');
    });

    it('exits 4 for an ambiguous ingredient name, before any USDA call', async () => {
        api = baseApi(EGG);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'stock', '--fdc-id', '171287'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
        expect(api.countOf('CliUsdaFoodItem')).to.equal(0);
    });

    it('exits 4 when the USDA item does not exist', async () => {
        api = baseApi(EGG);
        api.on('CliUsdaFoodItem', {
            errors: [{ message: 'Food item not found', extensions: { code: 'NOT_FOUND' } }],
        });
        api.install();
        const { error } = await runCommand(['nutrition', 'link', 'egg', '--fdc-id', '1'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
    });
});
