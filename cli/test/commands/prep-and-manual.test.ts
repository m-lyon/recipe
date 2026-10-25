import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import type { UsdaFoodItem } from '../../src/lib/types.js';
import { CUP, EACH, MILLILITRE } from '../helpers/fixtures.js';
import { CHOPPED, INGREDIENTS, JUICED, MEASURE_COMPONENTS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

const LIME = {
    __typename: 'Ingredient',
    _id: 'ing-lime',
    name: 'lime',
    pluralName: 'limes',
    isCountable: true,
    tags: [],
};

/** Lime juice, raw: the prepared food behind "lime, juiced". */
const LIME_JUICE: UsdaFoodItem = {
    fdcId: 168156,
    description: 'Lime juice, raw',
    dataType: 'SR Legacy',
    caloriesPer100g: 25,
    proteinPer100g: 0.42,
    carbsPer100g: 8.42,
    fatPer100g: 0.07,
    portions: [
        {
            description: '1 cup',
            amount: 1,
            modifier: 'cup',
            gramWeight: 242,
            kind: 'VOLUME',
            millilitres: 236.588,
            impliedDensity: 1.02,
            ambiguous: false,
        },
        {
            description: '1 cup, chopped',
            amount: 1,
            modifier: 'cup, chopped',
            gramWeight: 150,
            kind: 'VOLUME',
            millilitres: 236.588,
            impliedDensity: 0.63,
            ambiguous: false,
        },
    ],
};

const PER_GRAM = { calories: 0.3, protein: 0.007, carbs: 0.106, fat: 0.002 };
const PLAIN_RECORD = {
    __typename: 'NutritionalInfo',
    _id: 'nut-lime',
    ingredient: 'ing-lime',
    prepMethod: null,
    source: 'usda',
    usdaFdcId: 168155,
    openFoodFactsBarcode: null,
    sourceName: 'Limes, raw',
    perGram: { __typename: 'MacroNutrients', ...PER_GRAM },
};
const JUICE_RECORD = {
    ...PLAIN_RECORD,
    _id: 'nut-lime-juice',
    prepMethod: { __typename: 'PrepMethod', ...JUICED },
    usdaFdcId: 168156,
    sourceName: 'Lime juice, raw',
};

const MUTATIONS = [
    'CliCreateNutritionalInfo',
    'CliUpdateNutritionalInfo',
    'CliDeleteNutritionalInfo',
    'CliCreateIngredientMeasure',
    'CliDeleteIngredientMeasure',
];

function limeApi(records: unknown[] = [], measures: unknown[] = []): FakeApi {
    const echo = (name: string, _id: string) => (variables: Record<string, unknown>) => ({
        data: { [name]: { record: { __typename: 'X', _id, ...(variables.record as object) } } },
    });
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliGetAllIngredients: { data: { ingredientManyAll: [...INGREDIENTS, LIME] } },
        CliUsdaFoodItem: {
            data: { usdaFoodItem: { __typename: 'UsdaFoodItem', ...LIME_JUICE } },
        },
        CliGetNutritionalInfos: { data: { nutritionalInfosByIngredientIds: records } },
        CliGetMeasureComponents: { data: MEASURE_COMPONENTS },
        CliGetIngredientMeasures: { data: { ingredientMeasuresByIngredientIds: measures } },
        CliCreateNutritionalInfo: echo('nutritionalInfoCreateOne', 'new-1'),
        CliUpdateNutritionalInfo: echo('nutritionalInfoUpdateById', 'nut-lime-juice'),
        CliDeleteNutritionalInfo: (variables) => ({
            data: { nutritionalInfoRemoveById: { recordId: variables.id } },
        }),
        CliCreateIngredientMeasure: echo('ingredientMeasureCreateOne', 'meas-1'),
    });
}

function json<T = Record<string, unknown>>(
    stdout: string
): { ok: boolean; data: T; error: { code: string; message: string }; warnings: string[] } {
    return JSON.parse(stdout);
}

describe('prep methods and manual entry', () => {
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

    const sent = (operation: string) =>
        api.requests
            .filter((r) => r.operation === operation)
            .map((r) => r.variables.record as Record<string, unknown>);

    describe('nutrition link --prep', () => {
        it('links the record for the prep method beside the plain one, with its portions', async () => {
            api = limeApi([PLAIN_RECORD]);
            api.install();
            const { stdout } = await runCommand(
                [
                    'nutrition',
                    'link',
                    'lime',
                    '--prep',
                    'juiced',
                    '--fdc-id',
                    '168156',
                    '--portion',
                    '"1 cup"',
                ],
                ROOT
            );
            const [record] = sent('CliCreateNutritionalInfo');
            expect(record.prepMethod).to.equal(JUICED._id);
            expect(record.usdaFdcId).to.equal(168156);
            expect(sent('CliUpdateNutritionalInfo')).to.deep.equal([]);
            // A cup of lime juice is a cup of juiced lime, not a cup of lime.
            expect(sent('CliCreateIngredientMeasure')).to.deep.equal([
                {
                    ingredient: 'ing-lime',
                    unit: CUP._id,
                    size: null,
                    prepMethod: JUICED._id,
                    grams: 242,
                },
            ]);
            expect(stdout).to.contain('Created NutritionalInfo for lime (juiced)');
        });

        it('exits 5 when the prep method already has a record', async () => {
            api = limeApi([PLAIN_RECORD, JUICE_RECORD]);
            api.install();
            const { stdout } = await runCommand(
                ['nutrition', 'link', 'lime', '--prep', 'juiced', '--fdc-id', '168156', '--json'],
                ROOT
            );
            expect(json(stdout).error.code).to.equal('WOULD_OVERWRITE');
            expect(json(stdout).error.message).to.contain(
                'lime (juiced) already has nutritional data (USDA 168156)'
            );
            expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
        });

        it('refuses a portion of another prep method', async () => {
            api = limeApi();
            api.install();
            const { error } = await runCommand(
                [
                    'nutrition',
                    'link',
                    'lime',
                    '--prep',
                    'juiced',
                    '--fdc-id',
                    '168156',
                    '--portion',
                    '2',
                ],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(error?.message).to.contain(`it is ${CHOPPED.value}, and the link is for juiced`);
            expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
        });

        it('exits 4 for a prep method that does not exist', async () => {
            api = limeApi();
            api.install();
            const { error } = await runCommand(
                ['nutrition', 'link', 'lime', '--prep', 'zested', '--fdc-id', '168156'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
            expect(error?.message).to.contain('No prep method named "zested"');
        });
    });

    describe('nutrition unlink --prep', () => {
        it('removes the record for the prep method, and leaves the plain one', async () => {
            api = limeApi([PLAIN_RECORD, JUICE_RECORD]);
            api.install();
            await runCommand(['nutrition', 'unlink', 'lime', '--prep', 'juiced'], ROOT);
            const removed = api.requests.filter((r) => r.operation === 'CliDeleteNutritionalInfo');
            expect(removed.map((r) => r.variables.id)).to.deep.equal(['nut-lime-juice']);
        });

        it('removes the plain record without --prep', async () => {
            api = limeApi([JUICE_RECORD, PLAIN_RECORD]);
            api.install();
            await runCommand(['nutrition', 'unlink', 'lime'], ROOT);
            const removed = api.requests.filter((r) => r.operation === 'CliDeleteNutritionalInfo');
            expect(removed.map((r) => r.variables.id)).to.deep.equal(['nut-lime']);
        });

        it('exits 4 when the prep method has no record', async () => {
            api = limeApi([PLAIN_RECORD]);
            api.install();
            const { error } = await runCommand(
                ['nutrition', 'unlink', 'lime', '--prep', 'juiced'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
            expect(error?.message).to.contain('lime has no nutritional data for juiced to remove');
        });
    });

    describe('nutrition set', () => {
        it('writes a manual record from values per 100 g, with where they came from', async () => {
            api = limeApi();
            api.install();
            const { stdout } = await runCommand(
                [
                    'nutrition',
                    'set',
                    'lime',
                    '--per-100g',
                    '30,0.7,10.6,0.2',
                    '--name',
                    '"Pack label"',
                ],
                ROOT
            );
            expect(sent('CliCreateNutritionalInfo')).to.deep.equal([
                {
                    ingredient: 'ing-lime',
                    prepMethod: null,
                    source: 'manual',
                    usdaFdcId: null,
                    openFoodFactsBarcode: null,
                    sourceName: 'Pack label',
                    perGram: { calories: 0.3, protein: 0.007, carbs: 0.106, fat: 0.002 },
                },
            ]);
            expect(stdout).to.contain('source      manual · Pack label');
        });

        it('converts values per 100 ml with the volume measure of the prep method', async () => {
            const juicedMl = {
                _id: 'meas-ml',
                ingredient: 'ing-lime',
                unit: MILLILITRE,
                size: null,
                prepMethod: JUICED,
                grams: 1.025,
            };
            // A cup of the plain fruit, which says nothing about the juice.
            const plainCup = {
                ...juicedMl,
                _id: 'meas-cup',
                unit: CUP,
                prepMethod: null,
                grams: 150,
            };
            api = limeApi([PLAIN_RECORD], [plainCup, juicedMl]);
            api.install();
            const { stdout } = await runCommand(
                [
                    'nutrition',
                    'set',
                    'lime',
                    '--prep',
                    'juiced',
                    '--per-100ml',
                    '25.625,0,0,0',
                    '--json',
                ],
                ROOT
            );
            const [record] = sent('CliCreateNutritionalInfo');
            expect(record.prepMethod).to.equal(JUICED._id);
            // 0.25625 kcal per ml over 1.025 g per ml.
            expect(record.perGram).to.deep.equal({ calories: 0.25, protein: 0, carbs: 0, fat: 0 });
            const data = json<{ density: { gramsPerMillilitre: number } }>(stdout).data;
            expect(data.density.gramsPerMillilitre).to.equal(1.025);
        });

        it('exits 6 for values per 100 ml when the prep method has no volume measure', async () => {
            const plainCup = {
                _id: 'meas-cup',
                ingredient: 'ing-lime',
                unit: CUP,
                size: null,
                prepMethod: null,
                grams: 150,
            };
            api = limeApi([], [plainCup]);
            api.install();
            const { error } = await runCommand(
                ['nutrition', 'set', 'lime', '--prep', 'juiced', '--per-100ml', '25,0.4,8.4,0.1'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(error?.message).to.contain('lime (juiced) has no volume measure');
            expect(error?.message).to.contain('--unit millilitre --prep "juiced"');
            expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
        });

        it('exits 6 for values that are not four numbers, before any request', async () => {
            api = limeApi();
            api.install();
            const { error } = await runCommand(
                ['nutrition', 'set', 'lime', '--per-100g', '30,1'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(api.requests).to.deep.equal([]);
        });

        it('exits 5 when a record exists, and replaces it under --overwrite, clearing its id', async () => {
            api = limeApi([PLAIN_RECORD]);
            api.install();
            const { error } = await runCommand(
                ['nutrition', 'set', 'lime', '--per-100g', '30,0.7,10.6,0.2'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.WOULD_OVERWRITE);
            expect(sent('CliCreateNutritionalInfo')).to.deep.equal([]);

            await runCommand(
                ['nutrition', 'set', 'lime', '--per-100g', '30,0.7,10.6,0.2', '--overwrite'],
                ROOT
            );
            const [update] = api.requests.filter((r) => r.operation === 'CliUpdateNutritionalInfo');
            expect(update.variables.id).to.equal('nut-lime');
            expect(update.variables.record).to.include({ source: 'manual', usdaFdcId: null });
        });

        it('sends nothing under --dry-run', async () => {
            api = limeApi();
            api.install();
            const { stdout } = await runCommand(
                ['nutrition', 'set', 'lime', '--per-100g', '30,0.7,10.6,0.2', '--dry-run'],
                ROOT
            );
            expect(api.operations.filter((name) => MUTATIONS.includes(name))).to.deep.equal([]);
            expect(stdout).to.contain('Would create NutritionalInfo for lime');
        });
    });

    describe('reading', () => {
        it('recipes show prices a juiced line with the juice record', async () => {
            const recipe = {
                __typename: 'Recipe',
                _id: 'rec-1',
                title: 'Dressing',
                titleIdentifier: 'dressing-a1',
                isIngredient: false,
                archived: false,
                ingredientSubsections: [
                    {
                        name: null,
                        ingredients: [
                            {
                                _id: 'ri-1',
                                quantity: '1',
                                unit: EACH,
                                prepMethod: JUICED,
                                ingredient: LIME,
                            },
                            {
                                _id: 'ri-2',
                                quantity: '1',
                                unit: EACH,
                                prepMethod: null,
                                ingredient: LIME,
                            },
                        ],
                    },
                ],
            };
            const each = { _id: 'meas-each', ingredient: 'ing-lime', unit: EACH, grams: 67 };
            const juiced = { ...each, _id: 'meas-juiced', prepMethod: JUICED, grams: 44 };
            api = limeApi([PLAIN_RECORD, JUICE_RECORD], [each, juiced]);
            api.on('CliGetRecipeByIdentifier', { data: { recipeOne: recipe } });
            api.install();
            const { stdout } = await runCommand(['recipes', 'show', 'dressing-a1', '--json'], ROOT);
            const lines = json<{
                ingredientSubsections: Array<{
                    ingredients: Array<{
                        nutrition: string;
                        usdaFdcId: number;
                        prepMethod: string;
                    }>;
                }>;
            }>(stdout).data.ingredientSubsections[0].ingredients;
            expect(
                lines.map((line) => [line.nutrition, line.usdaFdcId, line.prepMethod])
            ).to.deep.equal([
                ['linked', 168156, 'juiced'],
                ['linked', 168155, null],
            ]);
        });

        it('ingredients list marks an ingredient with only a prep record as missing', async () => {
            api = limeApi([JUICE_RECORD]);
            api.install();
            const { stdout } = await runCommand(
                ['ingredients', 'list', '--missing-nutrition', '--json'],
                ROOT
            );
            const lime = json<{
                ingredients: Array<{ name: string; nutrition: string; prepMethods: string[] }>;
            }>(stdout).data.ingredients.find((ingredient) => ingredient.name === 'lime');
            expect(lime).to.include({ nutrition: 'prep only' });
            expect(lime?.prepMethods).to.deep.equal(['juiced']);
        });

        it('ingredients show lists every record', async () => {
            api = limeApi([JUICE_RECORD, PLAIN_RECORD]);
            api.on('CliGetAllRecipes', { data: { recipeMany: [] } });
            api.install();
            const { stdout } = await runCommand(['ingredients', 'show', 'lime', '--json'], ROOT);
            const data = json<{
                nutritionalInfo: { _id: string };
                nutritionalInfos: Array<{ _id: string }>;
            }>(stdout).data;
            expect(data.nutritionalInfo._id).to.equal('nut-lime');
            expect(data.nutritionalInfos.map((info) => info._id)).to.deep.equal([
                'nut-lime',
                'nut-lime-juice',
            ]);
        });
    });
});
