import 'dotenv-flow/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: process.env.VITE_GRAPHQL_ENDPOINT,
    documents: ['src/**/*.tsx', 'src/**/*.ts'],
    generates: {
        './src/__generated__/': {
            preset: 'client',
            config: {
                avoidOptionals: {
                    field: true,
                    inputValue: false,
                    object: false,
                    defaultValue: false,
                },
                nonOptionalTypename: true,
                enumsAsTypes: true,
            },
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
