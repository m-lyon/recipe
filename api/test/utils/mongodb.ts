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
            console.log('closing connection');
            await mongoose.connection.close();
            console.log('connection closed');
        }
        if (this.mongoServer) {
            console.log('closing mongo');
            await this.mongoServer.stop();
            console.log('mongo closed');
        }
        if (this.apolloServer) {
            console.log('closing apollo');
            await this.apolloServer.stop();
            console.log('apollo closed');
        }
    } catch (error) {
        console.log(error);
        assert.fail('Connection not closed');
    }
}
