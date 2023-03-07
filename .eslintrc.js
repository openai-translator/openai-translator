module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true,
    },
    extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    overrides: [],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['react', 'react-hooks', '@typescript-eslint', 'prettier', 'baseui'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'camelcase': 'error',
        'spaced-comment': 'error',
        'no-duplicate-imports': 'error',
        'baseui/deprecated-theme-api': 'warn',
        'baseui/deprecated-component-api': 'warn',
        'baseui/no-deep-imports': 'warn',
        'prettier/prettier': 'error',
    },
    settings: {
        'import/resolver': {
            typescript: {},
        },
        'react': {
            version: 'detect',
        },
    },
}
