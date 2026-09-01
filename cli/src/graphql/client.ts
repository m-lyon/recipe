import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

import { LOGIN } from './operations.js';
import type { Config } from '../constants.js';
import { UsdaCache, fingerprint } from '../lib/usdaCache.js';
import { SessionCache, extractSessionCookie } from '../lib/session.js';
import { CliError, fromGraphQLCode, notAuthenticated, runtime } from '../lib/errors.js';

interface GraphQLResponse<T> {
    data?: T | null;
    errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

/** USDA quota is 1000 requests per hour on a production key. */
const USDA_RATE_LIMIT_RETRIES = 3;
const USDA_RATE_LIMIT_BASE_DELAY_MS = 1000;

function isUsdaRateLimit(message: string): boolean {
    return /USDA API error: 429/.test(message);
}

/**
 * The generated `gql()` returns an empty object for a source string it has never
 * seen, which happens when an operation is edited and codegen is not re-run.
 * Fail loudly rather than sending a malformed query.
 */
function assertGenerated<T>(document: T): T {
    if (!document || (document as { kind?: string }).kind !== 'Document') {
        throw runtime(
            'The generated GraphQL documents are stale or missing. Run "npm run generate" in cli/ ' +
                'against a running API.'
        );
    }
    return document;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RequestOptions<TResult> {
    /** Recognises a response that means the session has expired. */
    staleWhen?: (result: TResult) => boolean;
}

export interface ApiClientOptions {
    /** Shortened in tests so the backoff does not slow the suite. */
    rateLimitDelayMs?: number;
    /** On-disk cache for usdaFoodItem responses. Omit to cache in memory only. */
    usdaCache?: UsdaCache;
}

/**
 * The single transport every command runs through.
 *
 * Authentication is transparent: the cached cookie is sent when there is one, a
 * missing cookie or an UNAUTHENTICATED response triggers a login, and the
 * original operation is retried exactly once. A second failure is a real
 * authentication error.
 */
export class ApiClient {
    readonly config: Config;
    readonly session: SessionCache;
    /** Requests actually put on the wire. Asserted on by the transport tests. */
    requestCount = 0;
    /** Whether the last cachedFoodItem call was served from disk. */
    usdaCacheHit = false;

    /** True when this process started with a cookie on disk. */
    readonly hadCachedSession: boolean;

    private cookie: string | null = null;
    private readonly rateLimitDelayMs: number;
    private readonly foodItemCache = new Map<number, unknown>();
    private readonly usdaCache?: UsdaCache;

    constructor(config: Config, session: SessionCache, options: ApiClientOptions = {}) {
        this.config = config;
        this.session = session;
        this.cookie = session.read();
        this.hadCachedSession = this.cookie !== null;
        this.rateLimitDelayMs = options.rateLimitDelayMs ?? USDA_RATE_LIMIT_BASE_DELAY_MS;
        this.usdaCache = options.usdaCache;
    }

    async request<TResult, TVars>(
        document: TypedDocumentNode<TResult, TVars>,
        variables?: TVars,
        options: RequestOptions<TResult> = {}
    ): Promise<TResult> {
        if (!this.cookie) {
            await this.login();
        }
        let result: TResult;
        try {
            result = await this.send(document, variables);
        } catch (error) {
            // Exactly one re-login and retry, and only on UNAUTHENTICATED. A
            // FORBIDDEN is a wrong role, which re-authenticating never fixes.
            // The login call itself does not run through here, so there is no loop.
            if (!(error instanceof CliError) || error.errorCode !== 'NOT_AUTHENTICATED') {
                throw error;
            }
            await this.login();
            return this.send(document, variables);
        }
        // Some resolvers answer an expired session with a null field rather than
        // an UNAUTHENTICATED error, so the caller can recognise that shape too.
        if (options.staleWhen?.(result)) {
            await this.login();
            const retried = await this.send(document, variables);
            if (options.staleWhen(retried)) {
                throw notAuthenticated(
                    'The API accepted the request but returned no authenticated user. ' +
                        'Check RECIPE_USERNAME and RECIPE_PASSWORD.'
                );
            }
            return retried;
        }
        return result;
    }

    /**
     * A USDA food item, from memory, then from disk, then from the API.
     *
     * The disk cache is what makes a bulk run affordable: `usda show`, a dry run
     * and the write that follows all read one food, and the server's USDA key
     * allows 1000 requests per hour.
     */
    async cachedFoodItem<TResult, TVars>(
        fdcId: number,
        document: TypedDocumentNode<TResult, TVars>,
        variables: TVars,
        options: { refresh?: boolean } = {}
    ): Promise<TResult> {
        const hit = this.foodItemCache.get(fdcId);
        if (hit !== undefined && !options.refresh) return hit as TResult;

        const key = fingerprint(print(assertGenerated(document)));
        if (!options.refresh) {
            const cached = this.usdaCache?.read<TResult>(fdcId, key);
            if (cached !== null && cached !== undefined) {
                this.foodItemCache.set(fdcId, cached);
                this.usdaCacheHit = true;
                return cached;
            }
        }

        const result = await this.request(document, variables);
        this.foodItemCache.set(fdcId, result);
        this.usdaCache?.write(fdcId, key, result);
        this.usdaCacheHit = false;
        return result;
    }

    async login(): Promise<void> {
        const body = {
            query: print(LOGIN),
            variables: { username: this.config.username, password: this.config.password },
        };
        const response = await this.post(body, null);
        const json = (await this.parse(response)) as GraphQLResponse<{
            login: { _id?: string | null } | null;
        }>;
        const failure = json.errors?.[0];
        if (failure) {
            throw notAuthenticated(
                `Login failed: ${failure.message}. Check RECIPE_USERNAME and RECIPE_PASSWORD.`
            );
        }
        if (!json.data?.login?._id) {
            throw notAuthenticated(
                'Login was rejected. Check RECIPE_USERNAME and RECIPE_PASSWORD.'
            );
        }
        const cookie = extractSessionCookie(response.headers.getSetCookie());
        if (!cookie) {
            throw runtime('The server did not return a session cookie on login.');
        }
        this.cookie = cookie;
        this.session.write(cookie);
    }

    /** Invalidates the server-side session and forgets the cached cookie. */
    forgetSession(): void {
        this.cookie = null;
        this.session.clear();
    }

    private async send<TResult, TVars>(
        document: TypedDocumentNode<TResult, TVars>,
        variables?: TVars
    ): Promise<TResult> {
        const body = { query: print(assertGenerated(document)), variables: variables ?? {} };
        for (let attempt = 0; ; attempt++) {
            const response = await this.post(body, this.cookie);
            const json = (await this.parse(response)) as GraphQLResponse<TResult>;
            const failure = json.errors?.[0];
            if (failure) {
                if (isUsdaRateLimit(failure.message) && attempt < USDA_RATE_LIMIT_RETRIES) {
                    await sleep(this.rateLimitDelayMs * 2 ** attempt);
                    continue;
                }
                if (isUsdaRateLimit(failure.message)) {
                    throw runtime(
                        `${failure.message}. The USDA quota for the server's API key is ` +
                            'exhausted (1000 requests per hour). Wait and try again.'
                    );
                }
                // The USDA resolvers throw a plain "Not authenticated" without an
                // extensions code, so match on the message as well.
                if (!failure.extensions?.code && /not authenticated/i.test(failure.message)) {
                    throw notAuthenticated(failure.message);
                }
                throw fromGraphQLCode(failure.extensions?.code, failure.message);
            }
            if (!json.data) {
                throw runtime('The server returned no data.');
            }
            return json.data;
        }
    }

    private async post(body: unknown, cookie: string | null): Promise<Response> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (cookie) headers['Cookie'] = cookie;
        this.requestCount++;
        try {
            return await fetch(this.config.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
        } catch (error) {
            throw runtime(
                `Could not reach the API at ${this.config.url}: ${(error as Error).message}. ` +
                    'Is it running?'
            );
        }
    }

    private async parse(response: Response): Promise<unknown> {
        let json: unknown;
        try {
            json = await response.json();
        } catch {
            throw runtime(`The API returned ${response.status} ${response.statusText}.`);
        }
        if (!response.ok && !(json as GraphQLResponse<unknown>).errors) {
            throw runtime(`The API returned ${response.status} ${response.statusText}.`);
        }
        return json;
    }
}
