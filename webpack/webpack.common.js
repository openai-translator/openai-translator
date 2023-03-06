/* eslint-disable camelcase */
const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const srcDir = path.join(__dirname, '..', 'src')

module.exports = {
    entry: {
        popup: path.join(srcDir, 'popup/index.tsx'),
        options: path.join(srcDir, 'options/index.tsx'),
        background: path.join(srcDir, 'background/index.ts'),
        content_script: path.join(srcDir, 'content_script/index.tsx'),
    },
    output: {
        path: path.join(__dirname, '../dist/js'),
        filename: '[name].js',
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                dependencyVendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors.dependencies',
                    chunks: 'all',
                },
                commonVendor: {
                    test: /[\\/]src[\\/]common[\\/]/,
                    name: 'vendors.common',
                    chunks: 'all',
                },
                contentScriptVendor: {
                    test: /[\\/]src[\\/]content_script[\\/]/,
                    name: 'vendors.content_script',
                    chunks: 'all',
                },
                popupVendor: {
                    test: /[\\/]src[\\/]popup[\\/]/,
                    name: 'vendors.popup',
                    chunks: 'all',
                },
                optionsVendor: {
                    test: /[\\/]src[\\/]options[\\/]/,
                    name: 'vendors.options',
                    chunks: 'all',
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            noEmit: false, // this option will solve the issue
                        },
                    },
                },
            },
            {
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                ident: 'postcss',
                                plugins: ['tailwindcss', 'autoprefixer'],
                            },
                        },
                    },
                ],
                test: /\.css$/i,
            },
            {
                test: /\.(jpg|jpeg|gif|png)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {},
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: '.', to: '../', context: 'public' }],
            options: {},
        }),
    ],
}
