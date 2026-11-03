import http from 'http';
import { AddressInfo } from 'net';

import express from 'express';
import { assert } from 'chai';
import session from 'express-session';
import { after, before, describe, it } from 'mocha';

import { SESSION_MAX_AGE, sessionOptions } from '../../src/utils/session.js';

describe('Session cookie', () => {
    const app = express();
    app.use(session(sessionOptions('test secret')));
    app.post('/login', (req, res) => {
        (req.session as unknown as { user: string }).user = 'someone';
        res.end();
    });
    app.get('/', (_req, res) => res.end());
    const server = http.createServer(app);
    let url: string;

    before((done) => {
        server.listen(0, '127.0.0.1', () => {
            url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
            done();
        });
    });
    after((done) => {
        server.close(done);
    });

    async function cookieAfter(path: string, method: string, cookie?: string) {
        const response = await fetch(`${url}${path}`, {
            method,
            headers: cookie ? { cookie } : {},
        });
        return response.headers.get('set-cookie');
    }

    it('should outlive the browser session', async () => {
        const before = Date.now();
        const cookie = await cookieAfter('/login', 'POST');

        assert.isNotNull(cookie);
        const expires = Date.parse(/Expires=([^;]+)/.exec(cookie!)![1]);
        // The header has whole seconds.
        assert.closeTo(expires - before, SESSION_MAX_AGE, 2000);
    });

    it('should move the expiry on with each request', async () => {
        const cookie = (await cookieAfter('/login', 'POST'))!.split(';')[0];

        const renewed = await cookieAfter('/', 'GET', cookie);

        assert.isNotNull(renewed);
        assert.match(renewed!, /Expires=/);
    });

    it('should set no cookie for a visitor who has not logged in', async () => {
        assert.isNull(await cookieAfter('/', 'GET'));
    });
});
