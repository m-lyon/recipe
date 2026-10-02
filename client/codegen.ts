import 'dotenv-flow/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const typesConfig = {
    // Codegen types custom scalars as `unknown` unless they are mapped here
    scalars: {
        MongoID: 'string',
        Date: 'string',
        RegExpAsString: 'string',
        Upload: 'File',
    },
    avoidOptionals: {
        field: true,
        inputValue: false,
        object: false,
        defaultValue: false,
    },
    nonOptionalTypename: true,
};

const config: CodegenConfig = {
    schema: process.env.VITE_GRAPHQL_URL,
    documents: ['src/**/*.tsx', 'src/**/*.ts'],
    generates: {
        './src/__generated__/': {
            preset: 'client',
            config: { ...typesConfig, enumType: 'const' },
            presetConfig: {
                gqlTagName: 'gql',
                fragmentMasking: false,
            },
        },
        // The client preset only emits the types its operations use. The test mocks are typed
        // against the full schema object types (Ingredient, Tag, ...), so emit those separately.
        './src/__generated__/schema.ts': {
            plugins: ['typescript'],
            config: { ...typesConfig, enumsAsConst: true },
        },
    },
    ignoreNoDocuments: false,
    verbose: true,
    debug: true,
};

export default config;
