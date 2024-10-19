import 'dotenv-flow/config';
import './utils/database.js';
import './strategies/GraphQLLocalStrategy.js';

import cors from 'cors';
import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { ApolloServer } from '@apollo/server';
import { buildContext } from 'graphql-passport';
import { expressMiddleware } from '@apollo/server/express4';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { schema } from './schema/index.js';
import { uploadRouter } from './routes/uploads.js';
import { createHttpServer, createHttpsServer } from './utils/server.js';
import { DELAY, HTTPS, PORT, SESSION_SECRET, SESSION_URI, WHITELIST } from './constants.js';

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
    graphqlUploadExpress({
        maxFileSize: 10000000, // 10 MB
        maxFiles: 10,
    })
);

app.use('/uploads', cors<cors.CorsRequest>(corsOptions), uploadRouter);
app.use(
    '/',
    cors<cors.CorsRequest>(corsOptions),
    bodyParser.json({ limit: '50mb' }),
    (req, res, next) => {
        if (DELAY) {
            setTimeout(() => {
                next();
            }, DELAY);
        } else {
            next();
        }
    },
    expressMiddleware(apolloServer, {
        context: async ({ req, res }) => buildContext({ req, res }),
    })
);

await new Promise<void>((resolve) => server.listen({ port: PORT }, resolve));
console.log('🚀 Server ready at', server.address());
