// Writes the GraphQL schema as SDL, so the client and CLI codegen need no running API
import fs from 'fs';

import { lexicographicSortSchema, printSchema } from 'graphql';

import { schema } from '../schema/index.js';

const [outFile = 'schema.graphql'] = process.argv.slice(2);
fs.writeFileSync(outFile, printSchema(lexicographicSortSchema(schema)) + '\n');
console.log('Wrote', outFile);
