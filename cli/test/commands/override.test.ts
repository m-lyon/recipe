import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { nutritionStatus } from '../../src/lib/nutrition.js';
import type { RecipeIngredientSummary } from '../../src/lib/types.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';
import { CUP, EACH, GRAM, INGREDIENTS, MEASURE_COMPONENTS, TEASPOON } from '../helpers/fixtures.js';

const [EGG, OIL, FLOUR] = INGREDIENTS;

const FRIED = {
    __typename: 'Recipe',
    _id: '64b000000000000000000001',
    title: 'Fried Eggs',
    titleIdentifier: 'fried-eggs-abcde',
    isIngredient: false,
    archived: false,
    ingredientSubsections: [
        {
            __typename: 'IngredientSubsection',
            name: null,
            ingredients: [
                {
                    _id: 'ri-oil',
                    quantity: '1',
                    unit: CUP,
                    size: null,
                    prepMethod: null,
                    nutritionOverride: null,
                    ingredient: OIL,
                },
                {
                    _id: 'ri-flour',
                    quantity: null,
                    unit: null,
                    size: null,
                    prepMethod: null,
                    nutritionOverride: null,
                    ingredient: FLOUR,
                },
                {
                    _id: 'ri-egg-1',
                    quantity: '2',
                    unit: EACH,
                    size: null,
                    prepMethod: null,
                    nutritionOverride: null,
                    ingredient: EGG,
                },
                {
                    _id: 'ri-egg-2',
                    quantity: '1',
                    unit: EACH,
                    size: null,
                    prepMethod: null,
                    nutritionOverride: null,
                    ingredient: EGG,
                },
            ],
        },
    ],
};

function baseApi(): FakeApi {
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliGetRecipeByIdentifier: { data: { recipeOne: FRIED } },
        CliGetMeasureComponents: { data: MEASURE_COMPONENTS },
        CliSetNutritionOverride: (variables) => ({
            data: { recipeSetNutritionOverride: { recordId: variables.id } },
        }),
    });
}

describe('nutrition override', () => {
    let api: FakeApi;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = baseApi();
        api.install();
    });
    afterEach(() => {
        api?.restore();
        cleanTestEnvironment();
        process.exitCode = 0;
    });

    function sent(): Array<Record<string, unknown>> {
        return api.requests
            .filter((r) => r.operation === 'CliSetNutritionOverride')
            .map((r) => r.variables);
    }

    async function run(...argv: string[]) {
        return runCommand(['nutrition', 'override', 'fried-eggs-abcde', ...argv], ROOT);
    }

    it('counts a share of a line', async () => {
        await run('"olive oil"', '--share', '15');
        expect(sent()).to.deep.equal([
            {
                id: FRIED._id,
                recipeIngredient: 'ri-oil',
                nutritionOverride: { mode: 'share', percent: 15 },
            },
        ]);
    });

    it('counts a set amount on a line with no quantity, in a unit found by any name', async () => {
        await run('flour', '--amount', '1/4', '--unit', 'tsp');
        expect(sent()).to.deep.equal([
            {
                id: FRIED._id,
                recipeIngredient: 'ri-flour',
                nutritionOverride: { mode: 'amount', quantity: '1/4', unit: TEASPOON._id },
            },
        ]);
    });

    it('counts a line as negligible, and clears an override', async () => {
        await run('flour', '--negligible');
        await run('flour', '--clear');
        expect(sent().map((variables) => variables.nutritionOverride)).to.deep.equal([
            { mode: 'negligible' },
            null,
        ]);
    });

    it('sends nothing on a dry run', async () => {
        const { result } = await run('"olive oil"', '--share', '15', '--dry-run', '--json');
        expect(sent()).to.deep.equal([]);
        expect(result).to.include({ dryRun: true });
    });

    it('refuses a share of a line with no quantity and exits 6', async () => {
        const { error } = await run('flour', '--share', '15');
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(sent()).to.deep.equal([]);
    });

    it('refuses a share over 100% and exits 6', async () => {
        const { error } = await run('"olive oil"', '--share', '150');
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        expect(sent()).to.deep.equal([]);
    });

    it('refuses a call with no change and exits 6', async () => {
        const { error } = await run('"olive oil"');
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
    });

    it('exits 4 for an ingredient on two lines, and takes a line id instead', async () => {
        const { error } = await run('egg', '--negligible');
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
        expect(sent()).to.deep.equal([]);
        await run('ri-egg-2', '--negligible');
        expect(sent()[0]).to.include({ recipeIngredient: 'ri-egg-2' });
    });

    it('exits 4 for an ingredient the recipe does not use', async () => {
        const { error } = await run('saffron', '--negligible');
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
    });
});

describe('nutritionStatus with an override', () => {
    const info = [{ _id: 'ni', ingredient: 'ing-flour', perGram: null }];
    const line = FRIED.ingredientSubsections[0].ingredients[1] as RecipeIngredientSummary;

    it('counts a negligible line with no quantity', () => {
        const status = nutritionStatus(
            { ...line, nutritionOverride: { mode: 'negligible' } },
            info
        );
        expect(status.state).to.equal('linked');
    });

    it('reads a set amount in place of the line', () => {
        const status = nutritionStatus(
            { ...line, nutritionOverride: { mode: 'amount', quantity: '5', unit: GRAM } },
            info
        );
        expect(status.state).to.equal('linked');
    });
});
