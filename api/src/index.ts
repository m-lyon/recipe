import 'dotenv-flow/config';
import './requireEnv.js';
import './strategies/GraphQLLocalStrategy.js';

import cors, { CorsOptions } from 'cors';
import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { ApolloServer } from '@apollo/server';
import { buildContext } from 'graphql-passport';
import { expressMiddleware } from '@as-integrations/express4';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import mongoose from './utils/database.js';
import { schema } from './schema/index.js';
import { uploadRouter } from './routes/uploads.js';
import { createHttpServer } from './utils/server.js';
import { syncNutritionSources } from './utils/nutritionSources.js';
import { describeStandardUnitReport, syncStandardUnits } from './utils/standardUnits.js';
import { DELAY, HOST, PORT, SESSION_SECRET, SESSION_URI, WHITELIST } from './constants.js';

console.log('Node version:', process.version);
const app = express();
const server = createHttpServer(app);
const apolloServer = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer: server })],
});
const corsOptions: CorsOptions = {
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
try {
    await mongoose.connection.asPromise();
    const report = await syncStandardUnits(mongoose.connection.db);
    for (const line of describeStandardUnitReport(report)) {
        console.log('Standard units:', line);
    }
} catch (error) {
    console.error('Could not sync standard units:', error);
}
try {
    const sources = await syncNutritionSources(mongoose.connection.db);
    if (sources.usda + sources.manual > 0) {
        console.log(`Nutrition sources: set ${sources.usda} to usda, ${sources.manual} to manual`);
    }
} catch (error) {
    console.error('Could not sync nutrition sources:', error);
}
app.use(
    session({
        store: MongoStore.create({ mongoUrl: SESSION_URI }),
        secret: SESSION_SECRET!, // Non-null assertion since requireEnv.ts checks it
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

await new Promise<void>((resolve) => server.listen({ port: PORT, host: HOST }, resolve));
console.log('🚀 Server ready at', server.address());
