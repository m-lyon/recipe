import http from 'http';

import express from 'express';

export function createHttpServer(app: express.Application): http.Server {
    console.log('Creating HTTP Server...');
    return http.createServer(app);
}
