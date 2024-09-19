import 'dotenv-flow/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: process.env.VITE_GRAPHQL_ENDPOINT,
    documents: ['src/**/*.tsx', 'src/**/*.ts'],
    generates: {
        './src/__generated__/': {
            preset: 'client',
            plugins: [],
            presetConfig: {
                gqlTagName: 'gql',
                fragmentMasking: false,
            },
        },
    },
    ignoreNoDocuments: false,
    verbose: true,
    debug: true,
};

export default config;
