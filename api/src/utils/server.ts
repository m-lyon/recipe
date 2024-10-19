import fs from 'fs';
import http from 'http';
import https from 'https';

import express from 'express';

import { FULLCHAIN_PEM, PRIVKEY_PEM } from '../constants.js';

export function createHttpServer(app: express.Application): http.Server {
    console.log('Creating HTTP Server...');
    return http.createServer(app);
}

export function createHttpsServer(app: express.Application): https.Server {
    console.log('Creating HTTPS Server...');
    const options = { key: fs.readFileSync(PRIVKEY_PEM), cert: fs.readFileSync(FULLCHAIN_PEM) };
    return https.createServer(options, app);
}
