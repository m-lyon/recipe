import { expect } from 'chai';

import { loadConfig } from '../src/constants.js';

describe('configuration', () => {
    const saved = { ...process.env };

    afterEach(() => {
        process.env = { ...saved };
    });

    for (const variable of ['RECIPE_API_URL', 'RECIPE_USERNAME', 'RECIPE_PASSWORD']) {
        it(`fails at startup naming ${variable} when it is missing`, () => {
            process.env.RECIPE_API_URL = 'http://api.test/';
            process.env.RECIPE_USERNAME = 'matt';
            process.env.RECIPE_PASSWORD = 'secret';
            delete process.env[variable];
            expect(() => loadConfig()).to.throw(variable);
        });
    }

    it('takes --url above the environment variable', () => {
        process.env.RECIPE_API_URL = 'http://from-env/';
        process.env.RECIPE_USERNAME = 'matt';
        process.env.RECIPE_PASSWORD = 'secret';
        expect(loadConfig('http://from-flag/').url).to.equal('http://from-flag/');
        expect(loadConfig().url).to.equal('http://from-env/');
    });
});
