import { PRIVKEY_PEM, FULLCHAIN_PEM } from '../constants.js';
import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';

export function createHttpServer(app: express.Application): http.Server {
    return http.createServer(app);
}

export function createHttpsServer(app: express.Application): https.Server {
    const options = { key: fs.readFileSync(PRIVKEY_PEM), cert: fs.readFileSync(FULLCHAIN_PEM) };
    return https.createServer(options, app);
}
