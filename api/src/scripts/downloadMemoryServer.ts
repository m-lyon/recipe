import 'dotenv-flow/config';

import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { MONGODB_OPTS } from '../../test/utils/mongodb.js';

async function downloadMemoryServer() {
    try {
        const server = await MongoMemoryServer.create(MONGODB_OPTS);
        await server.stop();
    } catch (error) {
        console.log(error);
    }
}

await downloadMemoryServer();
