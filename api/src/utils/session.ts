import { SessionOptions, Store } from 'express-session';


export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export function sessionOptions(secret: string, store?: Store): SessionOptions {
    return {
        store,
        secret,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: { maxAge: SESSION_MAX_AGE },
    };
}
