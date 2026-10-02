import sinon from 'sinon';

export interface RecordedRequest {
    operation: string;
    variables: Record<string, unknown>;
    cookie?: string;
}

export interface GraphQLReply {
    data?: unknown;
    errors?: Array<{ message: string; extensions?: { code?: string } }>;
    status?: number;
    setCookie?: string[];
}

export type Handler = (variables: Record<string, unknown>, call: number) => GraphQLReply;

const OPERATION = /\b(?:query|mutation)\s+(\w+)/;

/**
 * A stubbed `global.fetch` that answers GraphQL operations by name and records
 * every request, so a test can assert that a mutation was never sent.
 */
export class FakeApi {
    readonly requests: RecordedRequest[] = [];

    private readonly handlers = new Map<string, Handler>();
    private readonly counts = new Map<string, number>();
    private stub?: sinon.SinonStub;

    constructor(handlers: Record<string, Handler | GraphQLReply> = {}) {
        for (const [name, handler] of Object.entries(handlers)) {
            this.on(name, handler);
        }
    }

    on(operation: string, handler: Handler | GraphQLReply): this {
        this.handlers.set(operation, typeof handler === 'function' ? handler : () => handler);
        return this;
    }

    /** Operation names in the order they were sent. */
    get operations(): string[] {
        return this.requests.map((request) => request.operation);
    }

    countOf(operation: string): number {
        return this.operations.filter((name) => name === operation).length;
    }

    install(): void {
        this.stub = sinon.stub(globalThis, 'fetch').callsFake((async (
            _url: string,
            init: { headers: Record<string, string>; body: string }
        ) => {
            const body = JSON.parse(init.body) as {
                query: string;
                variables: Record<string, unknown>;
            };
            const operation = OPERATION.exec(body.query)?.[1] ?? 'unknown';
            this.requests.push({
                operation,
                variables: body.variables,
                cookie: init.headers['Cookie'],
            });
            const handler = this.handlers.get(operation);
            if (!handler) {
                throw new Error(`FakeApi has no handler for "${operation}"`);
            }
            const seen = (this.counts.get(operation) ?? 0) + 1;
            this.counts.set(operation, seen);
            const reply = handler(body.variables, seen);
            return makeResponse(reply);
        }) as unknown as typeof fetch);
    }

    restore(): void {
        this.stub?.restore();
    }
}

function makeResponse(reply: GraphQLReply): Response {
    const status = reply.status ?? 200;
    const setCookie = reply.setCookie ?? [];
    return {
        ok: status < 400,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: { getSetCookie: () => setCookie },
        json: async () => ({ data: reply.data ?? null, errors: reply.errors }),
    } as unknown as Response;
}

/** The reply a successful login gives, including the session cookie. */
export const LOGIN_OK: GraphQLReply = {
    data: { login: { __typename: 'User', _id: 'user-1', username: 'matt', role: 'admin' } },
    setCookie: ['connect.sid=s%3Aabc123.sig; Path=/; HttpOnly'],
};

export const UNAUTHENTICATED: GraphQLReply = {
    errors: [{ message: 'Not authenticated', extensions: { code: 'UNAUTHENTICATED' } }],
};
