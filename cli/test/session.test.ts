import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync, statSync } from 'node:fs';

import { expect } from 'chai';

import { SessionCache, defaultSessionFile, extractSessionCookie } from '../src/lib/session.js';

describe('session cache', () => {
    let directory: string;

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'recipe-cli-session-'));
    });
    afterEach(() => {
        rmSync(directory, { force: true, recursive: true });
    });

    it('keys the file by API URL so targets never share a session', () => {
        const development = defaultSessionFile('http://localhost:4000/');
        const production = defaultSessionFile('https://recipes.example.com/');
        expect(development).to.not.equal(production);
        expect(development).to.match(/session-[\da-f]{16}$/);
    });

    it('writes the cookie with mode 0600 and reads it back', () => {
        const cache = new SessionCache(join(directory, 'nested', 'session'));
        cache.write('connect.sid=abc');
        expect(cache.read()).to.equal('connect.sid=abc');
        expect(statSync(cache.file).mode & 0o777).to.equal(0o600);
    });

    it('returns null when there is no cache, and clears one that exists', () => {
        const cache = new SessionCache(join(directory, 'session'));
        expect(cache.read()).to.equal(null);
        cache.write('connect.sid=abc');
        cache.clear();
        expect(cache.read()).to.equal(null);
    });

    it('picks connect.sid out of the Set-Cookie header list', () => {
        const cookie = extractSessionCookie([
            'other=1; Path=/',
            'connect.sid=s%3Aabc.sig; Path=/; HttpOnly',
        ]);
        expect(cookie).to.equal('connect.sid=s%3Aabc.sig');
        expect(extractSessionCookie(['other=1'])).to.equal(null);
    });
});
