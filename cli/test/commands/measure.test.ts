import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';
import { CHOPPED, CUP, EACH, INGREDIENTS, LARGE, MEASURE_COMPONENTS } from '../helpers/fixtures.js';

const MUTATIONS = ['CliCreateIngredientMeasure', 'CliDeleteIngredientMeasure'];

const EXISTING_LARGE = {
    __typename: 'IngredientMeasure',
    _id: 'meas-old',
    ingredient: 'ing-egg',
    grams: 50,
    unit: EACH,
    size: LARGE,
    prepMethod: null,
};

function baseApi(measures: unknown[] = []): FakeApi {
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliGetAllIngredients: { data: { ingredientManyAll: INGREDIENTS } },
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

describe('nutrition measure', () => {
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

    function mutations(): string[] {
        return api.operations.filter((name) => MUTATIONS.includes(name));
    }

    it('stores a count unit with a size', async () => {
        api = baseApi();
        api.install();
        await runCommand(
            ['nutrition', 'measure', 'egg', '--unit', 'each', '--size', 'large', '--grams', '57'],
            ROOT
        );
        expect(measureRecords()).to.deep.equal([
            { ingredient: 'ing-egg', unit: EACH._id, size: LARGE._id, prepMethod: null, grams: 57 },
        ]);
    });

    it('stores a volume unit with a prep method', async () => {
        api = baseApi();
        api.install();
        await runCommand(
            [
                'nutrition',
                'measure',
                'flour',
                '--unit',
                'cups',
                '--prep',
                'chopped',
                '--grams',
                '120',
            ],
            ROOT
        );
        expect(measureRecords()).to.deep.equal([
            {
                ingredient: 'ing-flour',
                unit: CUP._id,
                size: null,
                prepMethod: CHOPPED._id,
                grams: 120,
            },
        ]);
    });

    it('refuses a mass unit and exits 6', async () => {
        api = baseApi();
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'measure', 'egg', '--unit', 'g', '--grams', '1'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(mutations()).to.deep.equal([]);
    });

    it('refuses a weight that is not a positive number and exits 6', async () => {
        api = baseApi();
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'measure', 'egg', '--unit', 'each', '--grams', 'abc'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(mutations()).to.deep.equal([]);
    });

    it('exits 4 for an unknown unit', async () => {
        api = baseApi();
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'measure', 'egg', '--unit', 'bucket', '--grams', '10'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
        expect(mutations()).to.deep.equal([]);
    });

    it('sends no mutation under --dry-run', async () => {
        api = baseApi();
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'measure', 'egg', '--unit', 'each', '--grams', '50', '--dry-run'],
            ROOT
        );
        expect(mutations()).to.deep.equal([]);
        expect(stdout).to.contain('1 each = 50.0 g');
    });

    it('exits 5 for a measure with the same key, before any write', async () => {
        api = baseApi([EXISTING_LARGE]);
        api.install();
        const { error } = await runCommand(
            ['nutrition', 'measure', 'egg', '--unit', 'each', '--size', 'large', '--grams', '57'],
            ROOT
        );
        expect(error?.oclif?.exit).to.equal(ExitCode.WOULD_OVERWRITE);
        expect(mutations()).to.deep.equal([]);
    });

    it('replaces a same-key measure with --overwrite', async () => {
        api = baseApi([EXISTING_LARGE]);
        api.install();
        const { stdout } = await runCommand(
            [
                'nutrition',
                'measure',
                'egg',
                '--unit',
                'each',
                '--size',
                'large',
                '--grams',
                '57',
                '--overwrite',
            ],
            ROOT
        );
        expect(mutations()).to.deep.equal([
            'CliDeleteIngredientMeasure',
            'CliCreateIngredientMeasure',
        ]);
        expect(stdout).to.contain('replacing 50.0 g');
    });
});
