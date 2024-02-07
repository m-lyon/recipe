import { WHITELIST, SESSION_SECRET, SESSION_URI, PORT, DEV } from './constants.js';
import './utils/connectdb.js';
import './strategies/GraphQLLocalStrategy.js';

import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import bodyParser from 'body-parser';
import MongoStore from 'connect-mongo';

import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import { buildContext } from 'graphql-passport';
import { ApolloServer } from '@apollo/server';
import { schema } from './schema/index.js';
import { createHttpServer, createHttpsServer } from './utils/connect.js';

const app = express();
const httpServer = DEV ? createHttpServer(app) : createHttpsServer(app);
const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || WHITELIST.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`Domain "${origin}" not allowed by CORS`));
        }
    },
    credentials: true,
};
await server.start();
app.use(
    session({
        store: MongoStore.create({ mongoUrl: SESSION_URI }),
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
    '/',
    cors<cors.CorsRequest>(corsOptions),
    bodyParser.json({ limit: '50mb' }),
    expressMiddleware(server, { context: async ({ req, res }) => buildContext({ req, res }) })
);

await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log('🚀 Server ready at', httpServer.address());
