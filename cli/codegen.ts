import 'dotenv-flow/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: process.env.RECIPE_API_URL,
    documents: ['src/**/*.ts'],
    generates: {
        './src/graphql/__generated__/': {
            preset: 'client',
            config: {
                enumsAsConst: true,
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
