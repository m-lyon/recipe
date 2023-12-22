import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';

export function normalisePort(val: string): number {
    let port = parseInt(val, 10);
    if (port >= 0) {
        // port number
        return port;
    }
    throw new Error('Invalid port');
}

export function createHttpServer(app: express.Application): http.Server {
    return http.createServer(app);
}

export function createHttpsServer(app: express.Application): https.Server {
    const options = {
        key: fs.readFileSync(process.env.PRIVKEY_PEM),
        cert: fs.readFileSync(process.env.FULLCHAIN_PEM),
    };
    return https.createServer(options, app);
}
