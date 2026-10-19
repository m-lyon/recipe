import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    // Written by `npm run print-schema` in api/
    schema: '../api/schema.graphql',
    documents: ['src/**/*.ts'],
    generates: {
        './src/graphql/__generated__/': {
            preset: 'client',
            config: {
                // Codegen types custom scalars as `unknown` unless they are mapped here
                scalars: {
                    MongoID: 'string',
                    Date: 'string',
                    RegExpAsString: 'string',
                    Upload: 'File',
                },
                enumType: 'const',
                nonOptionalTypename: true,
            },
            presetConfig: {
                gqlTagName: 'gql',
                fragmentMasking: false,
            },
        },
    },
    // The CLI compiles with moduleResolution "nodenext", which requires an explicit
    // extension on every relative import, including the generated ones.
    emitLegacyCommonJSImports: false,
    ignoreNoDocuments: false,
};

export default config;
