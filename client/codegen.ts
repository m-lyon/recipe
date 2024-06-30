import 'dotenv-flow/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    //@ts-expect-error can't find a good reason why process type is not found
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
