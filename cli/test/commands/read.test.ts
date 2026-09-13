import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { EGG, INGREDIENTS, OLIVE_OIL } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

const USER = {
    __typename: 'User',
    _id: 'user-1',
    username: 'matt',
    role: 'admin',
    firstName: 'Matt',
    lastName: 'Lyon',
};

const RECIPE = {
    __typename: 'Recipe',
    _id: 'rec-1',
    title: 'Tomato soup',
    titleIdentifier: 'tomato-soup-a4f2k',
    isIngredient: false,
    archived: false,
    ingredientSubsections: [
        {
            __typename: 'IngredientSubsection',
            name: null,
            ingredients: [
                {
                    _id: 'ri-1',
                    quantity: '2',
                    unit: null,
                    size: null,
                    ingredient: INGREDIENTS[0],
                },
                {
                    _id: 'ri-2',
                    quantity: '30',
                    unit: {
                        __typename: 'Unit',
                        _id: 'u-g',
                        shortSingular: 'g',
                        measureType: 'mass',
                    },
                    size: null,
                    ingredient: INGREDIENTS[1],
                },
            ],
        },
    ],
};

const EGG_INFO = {
    __typename: 'NutritionalInfo',
    _id: 'nut-egg',
    ingredient: 'ing-egg',
    usdaFdcId: 171287,
    perGram: { calories: 1.43, protein: 0.1256, carbs: 0.0072, fat: 0.0951 },
    perUnit: { calories: 71.5, protein: 6.28, carbs: 0.36, fat: 4.755 },
};

/** The output envelope. The caller names the shape of `data` it asserts on. */
function json<T = Record<string, unknown>>(
    stdout: string
): { ok: boolean; data: T; warnings: string[]; error: Record<string, unknown> } {
    return JSON.parse(stdout);
}

describe('read commands', () => {
    let api: FakeApi;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = new FakeApi({
            CliLogin: LOGIN_OK,
            CliCurrentUser: { data: { currentUser: USER } },
            CliLogout: { data: { logout: true } },
            CliGetAllIngredients: { data: { ingredientManyAll: INGREDIENTS } },
            CliGetAllRecipes: { data: { recipeMany: [RECIPE] } },
            CliGetRecipesByIds: { data: { recipeByIds: [RECIPE] } },
            CliGetRecipeByIdentifier: { data: { recipeOne: RECIPE } },
            CliGetNutritionalInfos: { data: { nutritionalInfosByIngredientIds: [EGG_INFO] } },
            CliGetNutritionalInfo: { data: { nutritionalInfoByIngredient: EGG_INFO } },
            CliUsdaSearch: {
                data: { usdaSearch: [{ __typename: 'UsdaFoodItem', ...OLIVE_OIL, portions: [] }] },
            },
            CliUsdaFoodItem: { data: { usdaFoodItem: { __typename: 'UsdaFoodItem', ...EGG } } },
        });
    });
    afterEach(() => {
        api?.restore();
        cleanTestEnvironment();
        process.exitCode = 0;
    });

    it('auth status reports the role', async () => {
        api.install();
        const { stdout } = await runCommand(['auth', 'status'], ROOT);
        expect(stdout).to.contain('Role      admin');
        expect(stdout).to.contain('http://api.test/');
    });

    it('auth status warns when the account is not an admin', async () => {
        api.on('CliCurrentUser', { data: { currentUser: { ...USER, role: 'user' } } });
        api.install();
        const { stdout } = await runCommand(['auth', 'status', '--json'], ROOT);
        expect(json(stdout).warnings.join(' ')).to.contain('exit code 3');
    });

    it('auth status exits 3 when the credentials are rejected', async () => {
        new SessionCache(sessionFile()).clear();
        api.on('CliLogin', { errors: [{ message: 'Password or username is incorrect' }] });
        api.install();
        const { error } = await runCommand(['auth', 'status'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.AUTH);
        expect(error?.message).to.contain('RECIPE_USERNAME');
    });

    it('auth logout deletes the cached cookie', async () => {
        api.install();
        await runCommand(['auth', 'logout'], ROOT);
        expect(api.countOf('CliLogout')).to.equal(1);
        expect(new SessionCache(sessionFile()).read()).to.equal(null);
    });

    it('recipes list counts the linked ingredients', async () => {
        api.install();
        const { stdout } = await runCommand(['recipes', 'list', '--json'], ROOT);
        const recipe = json<{ recipes: Array<{ ingredients: number; linked: number }> }>(stdout)
            .data.recipes[0];
        expect(recipe.ingredients).to.equal(2);
        expect(recipe.linked).to.equal(1);
    });

    it('recipes show names the reason an ingredient is not calculable', async () => {
        api.install();
        const { stdout } = await runCommand(['recipes', 'show', 'tomato-soup-a4f2k'], ROOT);
        expect(stdout).to.contain('egg');
        expect(stdout).to.contain('linked');
        expect(stdout).to.contain('No nutritional data');
    });

    it('recipes show exits 4 for an unknown identifier', async () => {
        api.on('CliGetRecipeByIdentifier', { data: { recipeOne: null } });
        api.install();
        const { error } = await runCommand(['recipes', 'show', 'no-such-recipe'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
    });

    it('ingredients list --missing-nutrition returns parseable JSON of the gaps', async () => {
        api.install();
        const { stdout } = await runCommand(
            ['ingredients', 'list', '--missing-nutrition', '--json'],
            ROOT
        );
        const payload = json<{ ingredients: Array<{ name: string }> }>(stdout);
        expect(payload.ok).to.equal(true);
        const names = payload.data.ingredients.map((ingredient) => ingredient.name);
        expect(names).to.not.include('egg');
        expect(names).to.include('olive oil');
    });

    it('ingredients show lists the recipes that use the ingredient', async () => {
        api.install();
        const { stdout } = await runCommand(['ingredients', 'show', 'egg', '--json'], ROOT);
        const payload = json<{
            nutritionalInfo: { usdaFdcId: number };
            usedBy: Array<{ titleIdentifier: string }>;
        }>(stdout).data;
        expect(payload.nutritionalInfo.usdaFdcId).to.equal(171287);
        expect(payload.usedBy[0].titleIdentifier).to.equal('tomato-soup-a4f2k');
    });

    it('usda search prints per 100 g values and the data type', async () => {
        api.install();
        const { stdout } = await runCommand(['usda', 'search', 'olive'], ROOT);
        expect(stdout).to.contain('171413');
        expect(stdout).to.contain('SR Legacy');
        expect(stdout).to.contain('884.0');
    });

    it('usda show prints the portion table with a KIND column', async () => {
        api.install();
        const { stdout } = await runCommand(['usda', 'show', '171287'], ROOT);
        expect(stdout).to.contain('KIND');
        expect(stdout).to.contain('5 item portions');
        expect(stdout).to.contain('ambiguous');
    });

    it('usda show says when a record has no item portions', async () => {
        api.on('CliUsdaFoodItem', {
            data: { usdaFoodItem: { __typename: 'UsdaFoodItem', ...OLIVE_OIL } },
        });
        api.install();
        const { stdout } = await runCommand(['usda', 'show', '171413'], ROOT);
        expect(stdout).to.contain('No item portions');
    });

    it('nutrition status reports coverage', async () => {
        api.install();
        const { stdout } = await runCommand(['nutrition', 'status', '--json'], ROOT);
        const payload = json<{ total: number; linked: number; missing: number }>(stdout).data;
        expect(payload.total).to.equal(INGREDIENTS.length);
        expect(payload.linked).to.equal(1);
        expect(payload.missing).to.equal(INGREDIENTS.length - 1);
    });

    it('nutrition unlink removes the record, and sends nothing under --dry-run', async () => {
        api.on('CliDeleteNutritionalInfo', {
            data: { nutritionalInfoRemoveById: { recordId: 'nut-egg' } },
        });
        api.install();
        await runCommand(['nutrition', 'unlink', 'egg', '--dry-run'], ROOT);
        expect(api.countOf('CliDeleteNutritionalInfo')).to.equal(0);
        await runCommand(['nutrition', 'unlink', 'egg'], ROOT);
        expect(api.countOf('CliDeleteNutritionalInfo')).to.equal(1);
    });

    it('nutrition unlink exits 4 when there is nothing to remove', async () => {
        api.on('CliGetNutritionalInfo', { data: { nutritionalInfoByIngredient: null } });
        api.install();
        const { error } = await runCommand(['nutrition', 'unlink', 'egg'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
    });

    it('maps a FORBIDDEN response to exit 3', async () => {
        api.on('CliGetNutritionalInfos', {
            errors: [{ message: 'Not authorized', extensions: { code: 'FORBIDDEN' } }],
        });
        api.install();
        const { error } = await runCommand(['ingredients', 'list'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.AUTH);
    });

    it('maps a BAD_USER_INPUT response to exit 6', async () => {
        api.on('CliUsdaSearch', {
            errors: [{ message: 'Invalid query argument', extensions: { code: 'BAD_USER_INPUT' } }],
        });
        api.install();
        const { error } = await runCommand(['usda', 'search', 'x'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
    });

    it('maps a network failure to exit 1', async () => {
        api.on('CliGetAllIngredients', () => {
            throw new TypeError('fetch failed');
        });
        api.install();
        const { error } = await runCommand(['ingredients', 'list'], ROOT);
        expect(error?.oclif?.exit).to.equal(ExitCode.RUNTIME);
        expect(error?.message).to.contain('Is it running?');
    });

    it('exits 2 for a usage error', async () => {
        api.install();
        const { error } = await runCommand(['nutrition', 'link', 'egg'], ROOT);
        // --fdc-id is required.
        expect(error?.oclif?.exit).to.equal(ExitCode.USAGE);
    });
});
