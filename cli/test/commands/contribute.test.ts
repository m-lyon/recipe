import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';

import { expect } from 'chai';
import { runCommand } from '@oclif/test';

import { ExitCode } from '../../src/lib/errors.js';
import { SessionCache } from '../../src/lib/session.js';
import { FakeApi, LOGIN_OK } from '../helpers/fakeApi.js';
import type { OpenFoodFactsProduct } from '../../src/lib/types.js';
import { KNORR_POTS, PEARL_COUSCOUS } from '../helpers/fixtures.js';
import { ROOT, cleanTestEnvironment, sessionFile, useTestEnvironment } from '../helpers/env.js';

const NOT_FOUND = {
    errors: [{ message: 'No Open Food Facts product', extensions: { code: 'NOT_FOUND' } }],
};

function contributed(host = 'world.openfoodfacts.net') {
    return (variables: Record<string, unknown>) => ({
        data: {
            openFoodFactsContribute: {
                barcode: (variables.input as { barcode: string }).barcode,
                host,
                fieldsSent: ['nutrition_data_per'],
                photoUploaded: variables.labelPhoto === null,
            },
        },
    });
}

function baseApi(product: OpenFoodFactsProduct | null = PEARL_COUSCOUS, host?: string): FakeApi {
    return new FakeApi({
        CliLogin: LOGIN_OK,
        CliOpenFoodFactsProduct: product
            ? { data: { openFoodFactsProduct: { __typename: 'OpenFoodFactsProduct', ...product } } }
            : NOT_FOUND,
        CliOpenFoodFactsContribute: contributed(host),
    });
}

function json<T = Record<string, unknown>>(
    stdout: string
): { ok: boolean; data: T; error: { code: string; message: string }; warnings: string[] } {
    return JSON.parse(stdout);
}

describe('open-food-facts contribute', () => {
    let api: FakeApi;
    let directory: string;
    let photo: string;

    beforeEach(() => {
        useTestEnvironment();
        new SessionCache(sessionFile()).write('connect.sid=cached');
        directory = mkdtempSync(join(tmpdir(), 'recipe-cli-photo-'));
        photo = join(directory, 'label.jpg');
        writeFileSync(photo, Buffer.from('jpeg bytes'));
    });
    afterEach(() => {
        api?.restore();
        cleanTestEnvironment();
        rmSync(directory, { recursive: true, force: true });
        process.exitCode = 0;
    });

    function contributions() {
        return api.requests.filter((r) => r.operation === 'CliOpenFoodFactsContribute');
    }

    it('shows the current values beside the new ones in a dry run, and sends nothing', async () => {
        api = baseApi();
        api.install();
        const { stdout } = await runCommand(
            [
                'open-food-facts',
                'contribute',
                '5010338301255',
                '--label-per-100g',
                '362,12,70,1.5',
                '--photo',
                photo,
                '--dry-run',
            ],
            ROOT
        );
        expect(stdout).to.contain("Product   Al'fez · Pearl Couscous (5010338301255)");
        expect(stdout).to.match(/carbs\s+72\s+70\s+← changes/);
        expect(stdout).to.not.match(/kcal\s+362\s+362\s+← changes/);
        expect(stdout).to.contain('Label photo: label.jpg (10 bytes)');
        expect(contributions()).to.deep.equal([]);
    });

    it('sends the label values and the photo as a multipart request', async () => {
        api = baseApi(KNORR_POTS);
        api.install();
        const { stdout } = await runCommand(
            [
                'open-food-facts',
                'contribute',
                '11213606',
                '--label-per-100g',
                '69,3.8,12,0.5',
                '--quantity',
                '"4 x 26 g"',
                '--photo',
                photo,
                '--json',
            ],
            ROOT
        );
        expect(json(stdout).ok).to.equal(true);
        const [request] = contributions();
        expect(request.variables).to.deep.equal({
            input: {
                barcode: '11213606',
                productName: null,
                brands: null,
                quantity: '4 x 26 g',
                per100g: { calories: 69, protein: 3.8, carbs: 12, fat: 0.5 },
            },
            labelPhoto: null,
        });
        expect(request.files).to.deep.equal({
            'variables.labelPhoto': { name: 'label.jpg', type: 'image/jpeg', size: 10 },
        });
        expect(request.headers?.['Apollo-Require-Preflight']).to.equal('true');
    });

    it('sends fields alone as plain JSON', async () => {
        api = baseApi();
        api.install();
        await runCommand(
            ['open-food-facts', 'contribute', '5010338301255', '--brands', '"Al\'fez"'],
            ROOT
        );
        const [request] = contributions();
        expect(request.files).to.equal(undefined);
        expect(request.headers?.['Content-Type']).to.equal('application/json');
    });

    it('says when the contribution went to staging, not to the public database', async () => {
        api = baseApi();
        api.install();
        const { stdout } = await runCommand(
            ['open-food-facts', 'contribute', '5010338301255', '--brands', 'Suma', '--json'],
            ROOT
        );
        expect(json(stdout).warnings.join(' ')).to.contain('staging server');
    });

    it('adds a missing product, and warns when it has no name', async () => {
        api = baseApi(null, 'world.openfoodfacts.org');
        api.install();
        const { stdout } = await runCommand(
            [
                'open-food-facts',
                'contribute',
                '5000000000001',
                '--label-per-100g',
                '69,3.8,12,0.5',
                '--json',
            ],
            ROOT
        );
        const payload = json<{ isNew: boolean }>(stdout);
        expect(payload.data.isNew).to.equal(true);
        expect(payload.warnings.join(' ')).to.contain('adds a new product. Pass --name');
        expect(payload.warnings.join(' ')).to.not.contain('staging');
        expect(contributions()).to.have.lengthOf(1);
    });

    it('drops the cached product, so the next show fetches the new values', async () => {
        api = baseApi();
        api.install();
        await runCommand(['open-food-facts', 'show', '5010338301255'], ROOT);
        await runCommand(['open-food-facts', 'show', '5010338301255'], ROOT);
        expect(api.countOf('CliOpenFoodFactsProduct')).to.equal(1);
        // The contribution reads the record fresh, then forgets it.
        await runCommand(
            ['open-food-facts', 'contribute', '5010338301255', '--brands', 'Suma'],
            ROOT
        );
        expect(api.countOf('CliOpenFoodFactsProduct')).to.equal(2);
        await runCommand(['open-food-facts', 'show', '5010338301255'], ROOT);
        expect(api.countOf('CliOpenFoodFactsProduct')).to.equal(3);
    });

    it('refuses a bad argument before any request', async () => {
        api = baseApi();
        api.install();
        const cases = [
            ['5010338301255'],
            ['5010338301255', '--label-per-100g', '362,12,72'],
            ['5010338301255', '--photo', join(directory, 'label.pdf')],
            ['5010338301255', '--photo', join(directory, 'missing.jpg')],
            ['12345', '--brands', 'Suma'],
        ];
        for (const args of cases) {
            const { error } = await runCommand(['open-food-facts', 'contribute', ...args], ROOT);
            expect(error?.oclif?.exit, args.join(' ')).to.equal(ExitCode.REJECTED);
        }
        expect(api.requests).to.deep.equal([]);
    });
});
