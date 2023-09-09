import 'dotenv-flow/config';
import './utils/connectdb.js';
import './strategies/GraphQLLocalStrategy.js';

import cors from 'cors';
import http from 'http';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import bodyParser from 'body-parser';

import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import { buildContext } from 'graphql-passport';
import { ApolloServer } from '@apollo/server';
import { schema } from './schema/index.js';

const app = express();
const httpServer = http.createServer(app);
const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(
    '/',
    cors<cors.CorsRequest>(),
    bodyParser.json({ limit: '50mb' }),
    expressMiddleware(server, { context: async ({ req, res }) => buildContext({ req, res }) })
);

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/`);
