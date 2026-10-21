import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { EACH, GRAM, INGREDIENTS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

const SALAD = {
    __typename: 'Recipe',
    _id: 'rec-salad',
    title: 'Pesto Couscous Salad',
    titleIdentifier: 'pesto-couscous-salad-abwmo',
    isIngredient: false,
    archived: false,
    ingredientSubsections: [
        {
            __typename: 'IngredientSubsection',
            name: null,
            ingredients: [
                {
                    _id: 'ri-couscous',
                    quantity: '300',
                    unit: GRAM,
                    size: null,
                    prepMethod: null,
                    ingredient: {
                        __typename: 'Recipe',
                        _id: 'rec-couscous',
                        title: 'Pearl Couscous',
                    },
                },
                {
                    _id: 'ri-egg',
                    quantity: '2',
                    unit: EACH,
                    size: null,
                    prepMethod: null,
                    ingredient: INGREDIENTS[0],
                },
                {
                    _id: 'ri-oil',
                    quantity: '30',
                    unit: GRAM,
                    size: null,
                    prepMethod: null,
                    ingredient: INGREDIENTS[1],
                },
            ],
        },
    ],
};

const macros = (calories: number) => ({ calories, protein: 0, carbs: calories / 4, fat: 0 });

const NUTRITION = {
    recipeById: {
        _id: 'rec-salad',
        title: 'Pesto Couscous Salad',
        titleIdentifier: 'pesto-couscous-salad-abwmo',
        numServings: 2,
        nutrition: {
            total: macros(400),
            lines: [
                {
                    recipeIngredient: 'ri-couscous',
                    status: 'PARTIAL',
                    macros: macros(300),
                    reason: {
                        code: 'CHILD_PARTIAL',
                        message: '1 of 4 ingredients in Pearl Couscous not counted',
                    },
                    childUncounted: 1,
                    childRecipe: 'rec-couscous',
                },
                {
                    recipeIngredient: 'ri-egg',
                    status: 'UNCOUNTED',
                    macros: macros(0),
                    reason: { code: 'NO_MEASURE', message: 'No weight recorded for 1 egg' },
                    childUncounted: null,
                    childRecipe: null,
                },
                {
                    recipeIngredient: 'ri-oil',
                    status: 'COUNTED',
                    macros: macros(100),
                    reason: null,
                    childUncounted: null,
                    childRecipe: null,
                },
            ],
        },
    },
};

describe('nutrition <recipe>', () => {
    let api: FakeApi;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = new FakeApi({
            CliLogin: LOGIN_OK,
            CliGetRecipeByIdentifier: { data: { recipeOne: SALAD } },
            CliRecipeNutrition: { data: NUTRITION },
        });
    });
    afterEach(() => {
        api?.restore();
        cleanTestEnvironment();
        process.exitCode = 0;
    });

    it('prints the batch, one serving, and the lines not fully counted', async () => {
        api.install();
        const { stdout } = await runCommand(['nutrition', 'pesto-couscous-salad-abwmo'], ROOT);
        expect(stdout).to.contain('Pesto Couscous Salad (pesto-couscous-salad-abwmo)');
        expect(stdout).to.match(/kcal\s+400\.0\s+200\.0/);
        expect(stdout).to.contain('1 of 3 lines counted');
        expect(stdout).to.contain('NOT COUNTED (1)');
        expect(stdout).to.contain('2 egg — No weight recorded for 1 egg');
        expect(stdout).to.contain('PARTLY COUNTED (1)');
        expect(stdout).to.contain(
            '300 g Pearl Couscous — 1 of 4 ingredients in Pearl Couscous not counted'
        );
        expect(
            api.requests.find((r) => r.operation === 'CliRecipeNutrition')?.variables
        ).to.deep.equal({
            id: 'rec-salad',
        });
    });

    it('returns the totals, one serving and each line in --json mode', async () => {
        api.install();
        const { stdout } = await runCommand(
            ['nutrition', 'pesto-couscous-salad-abwmo', '--json'],
            ROOT
        );
        const data = JSON.parse(stdout).data;
        expect(data.total.calories).to.equal(400);
        expect(data.perServing.calories).to.equal(200);
        expect(data.lines.map((line: { text: string }) => line.text)).to.deep.equal([
            '300 g Pearl Couscous',
            '2 egg',
            '30 g olive oil',
        ]);
    });

    it('exits 4 for an unknown recipe', async () => {
        api.on('CliGetRecipeByIdentifier', { data: { recipeOne: null } });
        api.on('CliGetAllRecipes', { data: { recipeMany: [] } });
        api.install();
        const { error } = await runCommand(['nutrition', 'no-such-recipe'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
    });
});
