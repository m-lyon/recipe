import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import { EGG, INGREDIENTS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

describe('USDA caching across commands', () => {
    let api: FakeApi;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = new FakeApi({
            CliLogin: LOGIN_OK,
            CliGetAllIngredients: { data: { ingredientManyAll: INGREDIENTS } },
            CliUsdaFoodItem: { data: { usdaFoodItem: { __typename: 'UsdaFoodItem', ...EGG } } },
            CliGetNutritionalInfo: { data: { nutritionalInfoByIngredient: null } },
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
        });
        api.install();
    });
    afterEach(() => {
        api?.restore();
        cleanTestEnvironment();
        process.exitCode = 0;
    });

    it('fetches the food once across usda show, a dry run and the write', async () => {
        await runCommand(['usda', 'show', '171287'], ROOT);
        await runCommand(
            [
                'nutrition',
                'link',
                'egg',
                '--fdc-id',
                '171287',
                '--portion',
                '"1 large"',
                '--dry-run',
            ],
            ROOT
        );
        await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--portion', '"1 large"'],
            ROOT
        );

        // Without the disk cache this sequence costs three upstream USDA calls.
        expect(api.countOf('CliUsdaFoodItem')).to.equal(1);
        expect(api.countOf('CliCreateNutritionalInfo')).to.equal(1);
    });

    it('reports a cache hit in the JSON output', async () => {
        const first = await runCommand<{ fromCache: boolean }>(
            ['usda', 'show', '171287', '--json'],
            ROOT
        );
        const second = await runCommand<{ fromCache: boolean }>(
            ['usda', 'show', '171287', '--json'],
            ROOT
        );

        expect(JSON.parse(first.stdout).data.fromCache).to.equal(false);
        expect(JSON.parse(second.stdout).data.fromCache).to.equal(true);
    });

    it('--refresh ignores the cache and fetches again', async () => {
        await runCommand(['usda', 'show', '171287'], ROOT);
        await runCommand(['usda', 'show', '171287', '--refresh'], ROOT);

        expect(api.countOf('CliUsdaFoodItem')).to.equal(2);
    });

    it('--refresh on nutrition link also bypasses the cache', async () => {
        await runCommand(['usda', 'show', '171287'], ROOT);
        await runCommand(
            ['nutrition', 'link', 'egg', '--fdc-id', '171287', '--dry-run', '--refresh'],
            ROOT
        );

        expect(api.countOf('CliUsdaFoodItem')).to.equal(2);
    });

    it('caches each fdcId separately', async () => {
        await runCommand(['usda', 'show', '171287'], ROOT);
        api.on('CliUsdaFoodItem', {
            data: { usdaFoodItem: { __typename: 'UsdaFoodItem', ...EGG, fdcId: 171413 } },
        });
        await runCommand(['usda', 'show', '171413'], ROOT);
        await runCommand(['usda', 'show', '171287'], ROOT);

        expect(api.countOf('CliUsdaFoodItem')).to.equal(2);
    });
});
