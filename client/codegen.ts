import 'dotenv-flow/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    //@ts-ignore
    schema: process.env.VITE_GRAPHQL_ENDPOINT,
    documents: ['src/**/*.tsx'],
    generates: {
        './src/__generated__/': {
            preset: 'client',
            plugins: [],
            presetConfig: {
                gqlTagName: 'gql',
            },
        },
    },
    ignoreNoDocuments: false,
    verbose: true,
    debug: true,
};

export default config;
