import { assert } from 'chai';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { schema } from '../../src/schema/index.js';

const MONGODB_OPTS = { binary: { version: '4.4.18' } };

export async function startServer() {
    try {
        this.mongoServer = await MongoMemoryServer.create(MONGODB_OPTS);
        await mongoose.connect(this.mongoServer.getUri());
        this.apolloServer = new ApolloServer({ schema });
        await this.apolloServer.start();
    } catch (error) {
        console.log(error);
        assert.fail('Connection not established');
    }
}

export async function stopServer() {
    try {
        if (mongoose.connection) {
            await mongoose.connection.close();
        }
        if (this.mongoServer) {
            await this.mongoServer.stop();
        }
        if (this.apolloServer) {
            await this.apolloServer.stop();
        }
    } catch (error) {
        console.log(error);
        assert.fail('Connection not closed');
    }
}
