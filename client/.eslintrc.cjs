module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    env: {
        node: true,
    },
    plugins: ['@typescript-eslint', 'prettier', 'import', 'react-hooks', 'import-line-sorter'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
    ],
    noInlineConfig: false,
    rules: {
        'no-restricted-imports': ['error', { patterns: ['@recipe/features/*/*'] }],
        'prettier/prettier': [
            'error',
            {
                singleQuote: true,
                jsxSingleQuote: true,
                printWidth: 100,
                tabWidth: 4,
                trailingComma: 'es5',
            },
        ],
        'sort-imports': [
            'error',
            {
                ignoreCase: false,
                ignoreDeclarationSort: true, // dont want to sort import lines, use eslint-plugin-import instead
                ignoreMemberSort: false,
                memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
                allowSeparatedGroups: true,
            },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-duplicates': 'off',
        'import/no-unresolved': 'off',
        'import/order': [
            'warn',
            {
                pathGroups: [
                    {
                        pattern: '@recipe/**',
                        group: 'external',
                        position: 'after',
                    },
                ],
                pathGroupsExcludedImportTypes: ['@recipe/**'],
                groups: [
                    'builtin', // Built-in imports (come from NodeJS native) go first
                    'external', // <- External imports
                    'internal', // <- Absolute imports
                    ['sibling', 'parent'], // <- Relative imports, the sibling and parent types they can be mingled together
                    'index', // <- index imports
                    'unknown', // <- unknown
                ],
                'newlines-between': 'always',
            },
        ],
        'import-line-sorter/sort-imports': 'error',
        'import-line-sorter/no-multiline-imports': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
        'import/resolver': {
            typescript: {
                project: './tsconfig.json',
            },
        },
    },
    ignorePatterns: ['**/*.cjs'], // Exclude files ending in .cjs from linting
};
