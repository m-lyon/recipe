import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';

import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { CHOPPED, EACH, GRAM, INGREDIENTS, LARGE, UNITS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

const MUTATIONS = ['CliCreateRecipe', 'CliUpdateRecipe'];

const COMPONENTS = {
    ingredients: INGREDIENTS,
    recipes: [],
    units: UNITS,
    sizes: [LARGE],
    prepMethods: [CHOPPED],
    tags: [{ _id: 'tag-soup', value: 'soup' }],
};

const STORED = {
    __typename: 'Recipe',
    _id: 'rec-1',
    title: 'Egg soup',
    titleIdentifier: 'egg-soup-abcde',
    pluralTitle: null,
    subTitle: null,
    source: null,
    notes: null,
    numServings: 2,
    isIngredient: false,
    tags: [],
    yield: [],
    ingredientSubsections: [
        {
            name: null,
            ingredients: [
                {
                    quantity: '2',
                    unit: EACH,
                    size: LARGE,
                    prepMethod: null,
                    ingredient: INGREDIENTS[0],
                },
            ],
        },
    ],
    instructionSubsections: [{ name: null, instructions: ['Boil the eggs.'] }],
};

const NEW_RECIPE = {
    title: 'Egg soup',
    numServings: 2,
    tags: ['soup'],
    ingredientSubsections: [
        {
            ingredients: [
                { quantity: '2', size: 'large', ingredient: 'egg' },
                { quantity: '10', unit: 'g', ingredient: 'olive oil' },
            ],
        },
    ],
    instructionSubsections: [{ instructions: ['Boil the eggs.'] }],
};

function summary(record: Record<string, unknown>) {
    return {
        __typename: 'Recipe',
        _id: 'rec-1',
        titleIdentifier: 'egg-soup-abcde',
        isIngredient: false,
        archived: false,
        title: record.title ?? STORED.title,
    };
}

function baseApi(): FakeApi {
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliGetRecipeFileComponents: { data: COMPONENTS },
        CliGetRecipeFileByIdentifier: (variables) => ({
            data: {
                recipeOne: variables.titleIdentifier === STORED.titleIdentifier ? STORED : null,
            },
        }),
        CliCreateRecipe: (variables) => ({
            data: {
                recipeCreateOne: { record: summary(variables.record as Record<string, unknown>) },
            },
        }),
        CliUpdateRecipe: (variables) => ({
            data: {
                recipeUpdateById: { record: summary(variables.record as Record<string, unknown>) },
            },
        }),
    });
}

describe('recipes create, update and export', () => {
    let api: FakeApi;
    let directory: string;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
        directory = mkdtempSync(join(tmpdir(), 'recipe-file-'));
        api = baseApi();
        api.install();
    });
    afterEach(() => {
        api.restore();
        cleanTestEnvironment();
        rmSync(directory, { force: true, recursive: true });
        process.exitCode = 0;
    });

    function writeRecipeFile(content: unknown): string {
        const path = join(directory, 'recipe.json');
        writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content));
        return path;
    }

    function mutations() {
        return api.requests.filter((r) => MUTATIONS.includes(r.operation));
    }

    describe('create', () => {
        it('sends the resolved record', async () => {
            const { stdout } = await runCommand(
                ['recipes', 'create', '--file', writeRecipeFile(NEW_RECIPE)],
                ROOT
            );
            const [sent] = mutations();
            expect(sent.operation).to.equal('CliCreateRecipe');
            expect(sent.variables.record).to.deep.equal({
                isIngredient: false,
                title: 'Egg soup',
                numServings: 2,
                tags: ['tag-soup'],
                ingredientSubsections: [
                    {
                        name: null,
                        ingredients: [
                            {
                                quantity: '2',
                                unit: null,
                                size: LARGE._id,
                                prepMethod: null,
                                ingredient: 'ing-egg',
                            },
                            {
                                quantity: '10',
                                unit: GRAM._id,
                                size: null,
                                prepMethod: null,
                                ingredient: 'ing-oil',
                            },
                        ],
                    },
                ],
                instructionSubsections: [{ name: null, instructions: ['Boil the eggs.'] }],
            });
            expect(stdout).to.contain('Created the recipe "Egg soup" (egg-soup-abcde)');
            expect(stdout).to.contain('10 g olive oil');
        });

        it('sends nothing on a dry run', async () => {
            const { stdout } = await runCommand(
                ['recipes', 'create', '--file', writeRecipeFile(NEW_RECIPE), '--dry-run'],
                ROOT
            );
            expect(mutations()).to.have.length(0);
            expect(stdout).to.contain('DRY RUN');
            expect(stdout).to.contain('2 large egg');
        });

        it('exits 6 for a file with problems, before any request', async () => {
            const { error } = await runCommand(
                ['recipes', 'create', '--file', writeRecipeFile({ title: 'Egg soup' })],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(api.requests).to.have.length(0);
        });

        it('exits 4 for an unknown ingredient, and sends nothing', async () => {
            const file = {
                ...NEW_RECIPE,
                ingredientSubsections: [{ ingredients: [{ ingredient: 'saffron' }] }],
            };
            const { error } = await runCommand(
                ['recipes', 'create', '--file', writeRecipeFile(file)],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
            expect(error?.message).to.contain('No ingredient named "saffron"');
            expect(mutations()).to.have.length(0);
        });

        it('exits 6 for an ingredient recipe with no plural title, and sends nothing', async () => {
            const { error } = await runCommand(
                [
                    'recipes',
                    'create',
                    '--file',
                    writeRecipeFile({ ...NEW_RECIPE, isIngredient: true }),
                ],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(error?.message).to.contain('pluralTitle');
            expect(api.requests).to.have.length(0);
        });

        it('reports a server rejection as exit 6', async () => {
            api.on('CliCreateRecipe', {
                errors: [
                    { message: 'Invalid quantity format', extensions: { code: 'BAD_USER_INPUT' } },
                ],
            });
            const { error } = await runCommand(
                ['recipes', 'create', '--file', writeRecipeFile(NEW_RECIPE)],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
        });
    });

    describe('export', () => {
        it('prints the recipe file', async () => {
            const { stdout } = await runCommand(
                ['recipes', 'export', STORED.titleIdentifier],
                ROOT
            );
            const file = JSON.parse(stdout);
            expect(file.title).to.equal('Egg soup');
            expect(file.ingredientSubsections[0].ingredients).to.deep.equal([
                { quantity: '2', size: 'large', ingredient: 'egg' },
            ]);
        });

        it('exits 4 for an unknown recipe', async () => {
            const { error } = await runCommand(['recipes', 'export', 'no-such-recipe'], ROOT);
            expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
        });
    });

    describe('update', () => {
        it('sends only the keys that changed', async () => {
            const file = { title: 'Egg soup', numServings: 4, notes: 'Serve hot.' };
            const { stdout } = await runCommand(
                ['recipes', 'update', STORED.titleIdentifier, '--file', writeRecipeFile(file)],
                ROOT
            );
            const [sent] = mutations();
            expect(sent.operation).to.equal('CliUpdateRecipe');
            expect(sent.variables).to.deep.equal({
                id: 'rec-1',
                record: { numServings: 4, notes: 'Serve hot.' },
            });
            expect(stdout).to.contain('Fields: notes, numServings');
        });

        it('sends nothing when the file matches the recipe', async () => {
            const exported = (await runCommand(['recipes', 'export', STORED.titleIdentifier], ROOT))
                .stdout;
            const { stdout } = await runCommand(
                ['recipes', 'update', STORED.titleIdentifier, '--file', writeRecipeFile(exported)],
                ROOT
            );
            expect(mutations()).to.have.length(0);
            expect(stdout).to.contain('No changes');
        });

        it('replaces the ingredient list whole', async () => {
            const file = { ingredientSubsections: NEW_RECIPE.ingredientSubsections };
            await runCommand(
                ['recipes', 'update', STORED.titleIdentifier, '--file', writeRecipeFile(file)],
                ROOT
            );
            const record = mutations()[0].variables.record as Record<string, unknown[]>;
            expect(Object.keys(record)).to.deep.equal(['ingredientSubsections']);
            expect(
                (record.ingredientSubsections[0] as { ingredients: unknown[] }).ingredients
            ).to.have.length(2);
        });

        it('exits 6 when marking a recipe as an ingredient with no plural title', async () => {
            const { error } = await runCommand(
                [
                    'recipes',
                    'update',
                    STORED.titleIdentifier,
                    '--file',
                    writeRecipeFile({ isIngredient: true }),
                ],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(mutations()).to.have.length(0);
        });

        it('sets a plural title and marks a recipe as an ingredient together', async () => {
            await runCommand(
                [
                    'recipes',
                    'update',
                    STORED.titleIdentifier,
                    '--file',
                    writeRecipeFile({ isIngredient: true, pluralTitle: 'Egg soups' }),
                ],
                ROOT
            );
            expect(mutations()[0].variables.record).to.deep.equal({
                pluralTitle: 'Egg soups',
                isIngredient: true,
            });
        });

        it('sends nothing on a dry run', async () => {
            const { stdout } = await runCommand(
                [
                    'recipes',
                    'update',
                    STORED.titleIdentifier,
                    '--file',
                    writeRecipeFile({ numServings: 6 }),
                    '--dry-run',
                ],
                ROOT
            );
            expect(mutations()).to.have.length(0);
            expect(stdout).to.contain('numServings: 6');
        });
    });
});
