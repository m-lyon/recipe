import { statSync } from 'node:fs';

import { expect } from 'chai';

import { ExitCode } from '../src/lib/errors.js';
import { loadConfig } from '../src/constants.js';
import { ApiClient } from '../src/graphql/client.js';
import { SessionCache } from '../src/lib/session.js';
import { CURRENT_USER } from '../src/graphql/operations.js';
import { FakeApi, LOGIN_OK, UNAUTHENTICATED } from './helpers/fakeApi.js';
import { cleanTestEnvironment, sessionFile, useTestEnvironment } from './helpers/env.js';

const CURRENT_USER_OK = {
    data: {
        currentUser: {
            __typename: 'User',
            _id: 'user-1',
            username: 'matt',
            role: 'admin',
            firstName: 'M',
            lastName: 'L',
        },
    },
};

function client(api: FakeApi): ApiClient {
    api.install();
    return new ApiClient(loadConfig(), new SessionCache(sessionFile()), { rateLimitDelayMs: 0 });
}

describe('transport and transparent login', () => {
    let api: FakeApi;

    beforeEach(() => {
        useTestEnvironment();
    });
    afterEach(() => {
        api?.restore();
        cleanTestEnvironment();
    });

    it('authenticates first when there is no cached cookie, then sends the operation', async () => {
        api = new FakeApi({ CliLogin: LOGIN_OK, CliCurrentUser: CURRENT_USER_OK });
        const result = await client(api).request(CURRENT_USER);

        expect(api.operations).to.deep.equal(['CliLogin', 'CliCurrentUser']);
        expect(result.currentUser?.username).to.equal('matt');
        expect(api.requests[1].cookie).to.equal('connect.sid=s%3Aabc123.sig');
    });

    it('caches the cookie with mode 0600', async () => {
        api = new FakeApi({ CliLogin: LOGIN_OK, CliCurrentUser: CURRENT_USER_OK });
        await client(api).request(CURRENT_USER);

        const cache = new SessionCache(sessionFile());
        expect(cache.read()).to.equal('connect.sid=s%3Aabc123.sig');
        expect(statSync(sessionFile()).mode & 0o777).to.equal(0o600);
    });

    it('reuses a cached cookie without logging in again', async () => {
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = new FakeApi({ CliLogin: LOGIN_OK, CliCurrentUser: CURRENT_USER_OK });
        await client(api).request(CURRENT_USER);

        expect(api.operations).to.deep.equal(['CliCurrentUser']);
        expect(api.requests[0].cookie).to.equal('connect.sid=cached');
    });

    it('re-authenticates exactly once on UNAUTHENTICATED and retries', async () => {
        new SessionCache(sessionFile()).write('connect.sid=expired');
        api = new FakeApi({
            CliLogin: LOGIN_OK,
            CliCurrentUser: (_variables, call) => (call === 1 ? UNAUTHENTICATED : CURRENT_USER_OK),
        });
        const result = await client(api).request(CURRENT_USER);

        expect(api.operations).to.deep.equal(['CliCurrentUser', 'CliLogin', 'CliCurrentUser']);
        expect(result.currentUser?.username).to.equal('matt');
    });

    it('exits 3 rather than looping when the retry also fails', async () => {
        new SessionCache(sessionFile()).write('connect.sid=expired');
        api = new FakeApi({ CliLogin: LOGIN_OK, CliCurrentUser: UNAUTHENTICATED });

        const error = await client(api)
            .request(CURRENT_USER)
            .catch((thrown) => thrown);

        expect(error.exitCode).to.equal(ExitCode.AUTH);
        expect(api.countOf('CliLogin')).to.equal(1);
        expect(api.operations).to.deep.equal(['CliCurrentUser', 'CliLogin', 'CliCurrentUser']);
    });

    it('never retries the login call itself', async () => {
        api = new FakeApi({
            CliLogin: { errors: [{ message: 'Password or username is incorrect' }] },
        });

        const error = await client(api)
            .request(CURRENT_USER)
            .catch((thrown) => thrown);

        expect(error.exitCode).to.equal(ExitCode.AUTH);
        expect(error.message).to.contain('RECIPE_USERNAME');
        expect(api.operations).to.deep.equal(['CliLogin']);
    });

    it('does not re-authenticate on FORBIDDEN, because the role is wrong', async () => {
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = new FakeApi({
            CliCurrentUser: {
                errors: [{ message: 'Not authorized', extensions: { code: 'FORBIDDEN' } }],
            },
        });

        const error = await client(api)
            .request(CURRENT_USER)
            .catch((thrown) => thrown);

        expect(error.exitCode).to.equal(ExitCode.AUTH);
        expect(error.errorCode).to.equal('FORBIDDEN');
        expect(api.operations).to.deep.equal(['CliCurrentUser']);
    });

    it('retries a USDA 429 three times and then names the quota', async () => {
        new SessionCache(sessionFile()).write('connect.sid=cached');
        api = new FakeApi({
            CliCurrentUser: { errors: [{ message: 'USDA API error: 429 Too Many Requests' }] },
        });

        const error = await client(api)
            .request(CURRENT_USER)
            .catch((thrown) => thrown);

        expect(api.countOf('CliCurrentUser')).to.equal(4);
        expect(error.message).to.contain('1000 requests per hour');
        expect(error.exitCode).to.equal(ExitCode.RUNTIME);
    });

    it('re-authenticates when a resolver answers an expired session with a null field', async () => {
        new SessionCache(sessionFile()).write('connect.sid=expired');
        api = new FakeApi({
            CliLogin: LOGIN_OK,
            CliCurrentUser: (_variables, call) =>
                call === 1 ? { data: { currentUser: null } } : CURRENT_USER_OK,
        });

        const result = await client(api).request(CURRENT_USER, undefined, {
            staleWhen: (data) => !data.currentUser,
        });

        expect(result.currentUser?.username).to.equal('matt');
        expect(api.operations).to.deep.equal(['CliCurrentUser', 'CliLogin', 'CliCurrentUser']);
    });
});
