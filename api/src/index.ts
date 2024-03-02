import { WHITELIST, SESSION_SECRET, SESSION_URI, PORT, HTTPS } from './constants.js';
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
const server = HTTPS ? createHttpsServer(app) : createHttpServer(app);
const apolloServer = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer: server })],
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
await apolloServer.start();
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
    expressMiddleware(apolloServer, { context: async ({ req, res }) => buildContext({ req, res }) })
);

await new Promise<void>((resolve) => server.listen({ port: PORT }, resolve));
console.log('🚀 Server ready at', server.address());
