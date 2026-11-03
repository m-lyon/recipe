import { SessionOptions, Store } from 'express-session';

// A cookie with no expiry ends with the browser session, and an installed PWA's session
// ends whenever the OS closes the app. So the cookie lasts this long after the last request.
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
