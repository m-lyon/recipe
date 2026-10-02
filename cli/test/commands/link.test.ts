import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { OLIVE_OIL } from '../helpers/fixtures.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { EGG, EXISTING_EGG_INFO, FLOUR, GARLIC, INGREDIENTS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

const MUTATIONS = ['CliCreateNutritionalInfo', 'CliUpdateNutritionalInfo', 'CliUpdateIngredient'];

function baseApi(item = EGG, existing: unknown = null): FakeApi {
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
        CliUpdateIngredient: (variables) => ({
            data: {
                ingredientUpdateById: {
                    record: { ...INGREDIENTS[1], ...(variables.record as object) },
                },
            },
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
        existing: { usdaFdcId: number; perUnit: { calories: number } };
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

    it('writes perGram from the per-100 g values', async () => {
        api = baseApi(OLIVE_OIL);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', '"olive oil"', '--fdc-id', '171413', '--json'],
            ROOT
        );
        const record = api.requests.find((r) => r.operation === 'CliCreateNutritionalInfo')
            ?.variables.record as Record<string, unknown>;
        expect(record.perGram).to.deep.equal({ calories: 8.84, protein: 0, carbs: 0, fat: 1 });
        expect(record.usdaFdcId).to.equal(171413);
        expect(json(stdout).ok).to.equal(true);
    });

    it('derives perUnit from a portion named by its description', async () => {
        api = baseApi(EGG);
        api.install();
        await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '"1 large"', '--json'],
            ROOT
        );
        const record = api.requests.find((r) => r.operation === 'CliCreateNutritionalInfo')
            ?.variables.record as Record<string, unknown>;
        expect(record.perUnit).to.deep.equal({
            calories: 71.5,
            protein: 6.28,
            carbs: 0.36,
            fat: 4.755,
        });
    });

    it('derives perUnit from a portion named by its index', async () => {
        api = baseApi(EGG);
        api.install();
        await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '3', '--json'],
            ROOT
        );
        const record = api.requests.find((r) => r.operation === 'CliCreateNutritionalInfo')
            ?.variables.record as { perUnit: { calories: number } };
        // Portion 3 is "1 jumbo", 63 g.
        expect(record.perUnit.calories).to.equal(90.09);
    });

    it('refuses a volume portion, exits 6 and sends no mutation', async () => {
        api = baseApi(EGG);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '6'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
    });

    it("refuses garlic's RACC serving portion, exits 6 and sends no mutation", async () => {
        api = baseApi(GARLIC);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'garlic', '--fdc-id', '1104647', '--portion', '1'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
    });

    it('warns that portions exist but none was chosen, for a countable ingredient', async () => {
        api = baseApi(EGG);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--json'],
            ROOT
        );
        expect(json(stdout).warnings.join(' ')).to.contain('none was chosen');
    });

    it('warns differently when the record offers no item portion at all', async () => {
        api = baseApi(GARLIC);
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'link', 'garlic', '--fdc-id', '1104647', '--json'],
            ROOT
        );
        const warning = json(stdout).warnings.join(' ');
        expect(warning).to.contain('no item portion');
        expect(warning).to.contain('cannot help');
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
        expect(json<{ dryRun: boolean }>(stdout).data.dryRun).to.equal(true);
    });

    it('exits 5 and sends no mutation when data already exists', async () => {
        api = baseApi(EGG, EXISTING_EGG_INFO);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '"1 medium"'],
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
        expect(payload.error.existing.perUnit.calories).to.equal(71.5);
    });

    it('replaces the record with --overwrite and reports the previous values', async () => {
        api = baseApi(EGG, EXISTING_EGG_INFO);
        api.install();
        const { stdout } = await runCommand(
            [
                'nutrition',
                'link',
                'egg',
                '--fdc-id',
                '171287',
                '--portion',
                '"1 medium"',
                '--overwrite',
            ],
            ROOT
        );
        expect(api.countOf('CliUpdateNutritionalInfo')).to.equal(1);
        expect(api.countOf('CliCreateNutritionalInfo')).to.equal(0);
        expect(stdout).to.contain('Previous values');
        expect(stdout).to.contain('71.5');
    });

    it('needs no flag for a first link', async () => {
        api = baseApi(EGG);
        api.install();
        await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '"1 large"'],
            ROOT
        );
        expect(api.countOf('CliCreateNutritionalInfo')).to.equal(1);
    });

    it('writes the density with --set-density', async () => {
        api = baseApi(OLIVE_OIL);
        api.install();
        await runCommand(
            ['nutrition', 'link', '"olive oil"', '--fdc-id', '171413', '--set-density'],
            ROOT
        );
        const record = api.requests.find((r) => r.operation === 'CliUpdateIngredient')?.variables
            .record as Record<string, number>;
        expect(record.density).to.be.closeTo(0.913, 0.001);
    });

    it('refuses --set-density from an ambiguous portion, and sends no mutation', async () => {
        api = baseApi(FLOUR);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'link', 'flour', '--fdc-id', '168894', '--set-density'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
    });

    it('exits 5 for --set-density against an existing density', async () => {
        api = baseApi(FLOUR);
        api.install();
        const { error } = await runCommand(
            [
                'nutrition',
                'link',
                'flour',
                '--fdc-id',
                '168894',
                '--set-density',
                '--allow-ambiguous-density',
            ],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.WOULD_OVERWRITE);
        expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
    });

    it('never writes a density without --set-density', async () => {
        api = baseApi(OLIVE_OIL);
        api.install();
        await runCommand(['nutrition', 'link', '"olive oil"', '--fdc-id', '171413'], ROOT);
        expect(api.countOf('CliUpdateIngredient')).to.equal(0);
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
