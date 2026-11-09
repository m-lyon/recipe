import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { INGREDIENTS } from '../helpers/fixtures.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

const MUTATIONS = ['CliCreateIngredient', 'CliUpdateIngredient'];

function baseApi(): FakeApi {
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliGetAllIngredients: { data: { ingredientManyAll: INGREDIENTS } },
        CliCreateIngredient: (variables) => ({
            data: {
                ingredientCreateOne: {
                    record: {
                        __typename: 'Ingredient',
                        _id: 'ing-new',
                        ...(variables.record as object),
                    },
                },
            },
        }),
        CliUpdateIngredient: (variables) => ({
            data: {
                ingredientUpdateById: {
                    record: {
                        __typename: 'Ingredient',
                        ...INGREDIENTS.find((i) => i._id === variables.id),
                        ...(variables.record as object),
                    },
                },
            },
        }),
    });
}

describe('ingredients create and update', () => {
    let api: FakeApi;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = baseApi();
        api.install();
    });
    afterEach(() => {
        api.restore();
        cleanTestEnvironment();
        process.exitCode = 0;
    });

    function sent() {
        return api.requests.filter((r) => MUTATIONS.includes(r.operation));
    }

    describe('create', () => {
        it('sends a lower-cased record with sorted tags', async () => {
            const { stdout } = await runCommand(
                [
                    'ingredients',
                    'create',
                    '"Curry Leaf"',
                    '--plural',
                    '"Curry Leaves"',
                    '--countable',
                    '--tag',
                    'vegetarian',
                    '--tag',
                    'vegan',
                ],
                ROOT
            );
            expect(sent()[0].variables.record).to.deep.equal({
                name: 'curry leaf',
                pluralName: 'curry leaves',
                isCountable: true,
                tags: ['vegan', 'vegetarian'],
            });
            expect(stdout).to.contain('Created the ingredient ing-new');
        });

        it('uses the name as the plural, and warns for a countable ingredient', async () => {
            const { stdout } = await runCommand(
                ['ingredients', 'create', 'shallot', '--countable', '--json'],
                ROOT
            );
            const result = JSON.parse(stdout);
            expect(result.data.record.pluralName).to.equal('shallot');
            expect(result.warnings[0]).to.contain('pass --plural');
        });

        it('exits 6 when another ingredient has the name as its plural, and sends nothing', async () => {
            const { error } = await runCommand(['ingredients', 'create', 'Eggs'], ROOT);
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(error?.message).to.contain('already used by the ingredient "egg"');
            expect(sent()).to.have.length(0);
        });

        it('rejects a tag the API does not allow', async () => {
            const { error } = await runCommand(
                ['ingredients', 'create', 'tempeh', '--tag', 'keto'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.USAGE);
            expect(sent()).to.have.length(0);
        });

        it('sends nothing on a dry run', async () => {
            const { stdout } = await runCommand(
                ['ingredients', 'create', 'tempeh', '--dry-run'],
                ROOT
            );
            expect(stdout).to.contain('DRY RUN');
            expect(stdout).to.contain('name: tempeh');
            expect(sent()).to.have.length(0);
        });
    });

    describe('update', () => {
        it('sends only the fields that change', async () => {
            const { stdout } = await runCommand(
                ['ingredients', 'update', 'garlic', '--no-countable', '--tag', 'vegan'],
                ROOT
            );
            expect(sent()[0].variables).to.deep.equal({
                id: 'ing-garlic',
                record: { isCountable: false, tags: ['vegan'] },
            });
            expect(stdout).to.contain('isCountable: yes → no');
            expect(stdout).to.contain('tags: — → vegan');
        });

        it('renames an ingredient', async () => {
            await runCommand(
                [
                    'ingredients',
                    'update',
                    'flour',
                    '--name',
                    '"Plain Flour"',
                    '--plural',
                    '"plain flour"',
                ],
                ROOT
            );
            expect(sent()[0].variables.record).to.deep.equal({
                name: 'plain flour',
                pluralName: 'plain flour',
            });
        });

        it('lets an ingredient keep its own name', async () => {
            await runCommand(['ingredients', 'update', 'egg', '--plural', 'egg'], ROOT);
            expect(sent()[0].variables.record).to.deep.equal({ pluralName: 'egg' });
        });

        it('exits 6 when the new name belongs to another ingredient', async () => {
            const { error } = await runCommand(
                ['ingredients', 'update', 'flour', '--name', 'egg'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(sent()).to.have.length(0);
        });

        it('sends nothing when the values match', async () => {
            const { stdout } = await runCommand(
                ['ingredients', 'update', 'egg', '--countable', '--name', 'egg'],
                ROOT
            );
            expect(stdout).to.contain('No changes');
            expect(sent()).to.have.length(0);
        });

        it('exits 6 when no change is requested', async () => {
            const { error } = await runCommand(['ingredients', 'update', 'egg'], ROOT);
            expect(error?.oclif?.exit).to.equal(ExitCode.REJECTED);
            expect(api.requests).to.have.length(0);
        });

        it('exits 4 for an ambiguous ingredient', async () => {
            const { error } = await runCommand(
                ['ingredients', 'update', 'stock', '--tag', 'vegan'],
                ROOT
            );
            expect(error?.oclif?.exit).to.equal(ExitCode.NOT_FOUND);
        });

        it('clears the tags', async () => {
            api.on('CliGetAllIngredients', {
                data: { ingredientManyAll: [{ ...INGREDIENTS[0], tags: ['vegetarian'] }] },
            });
            await runCommand(['ingredients', 'update', 'egg', '--clear-tags'], ROOT);
            expect(sent()[0].variables.record).to.deep.equal({ tags: [] });
        });

        it('sends nothing on a dry run', async () => {
            const { stdout } = await runCommand(
                ['ingredients', 'update', 'egg', '--plural', 'egges', '--dry-run'],
                ROOT
            );
            expect(stdout).to.contain('pluralName: eggs → egges');
            expect(sent()).to.have.length(0);
        });
    });
});
