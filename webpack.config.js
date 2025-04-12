const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { dependencies } = require('webpack');

const name = "VirtualTable";

module.exports = [
    {
        name: 'library',
        entry: {
            [name]: './src/index.ts',
        },
        output: {
            filename: `${name}.min.js`,
            path: path.resolve(__dirname, 'dist'),
            library: name,
            libraryTarget: 'umd',
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
        },
        performance: {
            hints: false,
        },
        optimization: {
            minimize: true,
        },
        devtool: 'source-map'
    },
    {
        name: 'test',
        dependencies: ['library'],
        entry: {
            test: './test/ts/main.ts',
        },
        output: {
            filename: 'test.js',
            path: path.resolve(__dirname, 'test', 'js'),
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                VirtualTable: path.resolve(__dirname, 'dist', `${name}.min.js`),
            }
        },
        devtool: 'source-map',
        mode: 'development',
    },
    {
        devServer: {
            static: [
                { directory: path.join(__dirname, 'test'), watch: true },
                { directory: path.join(__dirname, 'dist'), watch: true }
            ],
            hot: true,
            liveReload: true,
            open: true,
            client: {
                logging: 'info',
                overlay: true,
                reconnect: true,
            }
        },
    }
];