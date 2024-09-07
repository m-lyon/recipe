import 'dotenv-flow/config';

import { startServer, stopServer } from '../utils/mongodb.js';

await startServer();
await stopServer();
