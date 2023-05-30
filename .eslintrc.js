module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    overrides: [],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    root: true,
    plugins: ['react', 'react-hooks', '@typescript-eslint', 'prettier', 'baseui'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'camelcase': 'error',
        'eqeqeq': ['error', 'always'],
        'spaced-comment': 'error',
        'no-duplicate-imports': 'error',
        'baseui/deprecated-theme-api': 'warn',
        'baseui/deprecated-component-api': 'warn',
        'baseui/no-deep-imports': 'warn',
        'prettier/prettier': 'error',
        'react-hooks/exhaustive-deps': 'warn',
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
