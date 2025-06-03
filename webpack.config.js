const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const name = "VirtualTable";

const config = {
    name: 'library',
    entry: {
        [name]: './src/index.ts',
    },
    output: {
        filename: `${name}.js`,
        path: path.resolve(__dirname, 'dist'),
        library: {
            type: 'module',
        }
    },
    experiments: {
        outputModule: true,
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
        minimize: false,
    },
};

const configs = {
    development: Object.assign({}, config, {
        devtool: 'source-map',
        devServer: {
            static: [
                { directory: path.join(__dirname, 'test'), watch: true },
                { directory: path.join(__dirname, 'dist'), watch: true, publicPath: '/dist' }
            ],
            hot: false, // not available for ESM modules yet
            liveReload: true,
            open: true,
            client: {
                logging: 'info',
                overlay: true,
                reconnect: true,
            }
        },
    }),
    production: Object.assign({}, config, {
        mode: 'production',
        output: {
            ...config.output,
            filename: `${name}.min.js`,
        },
        optimization: {
            ...config.optimization,
            minimize: true,
        },
    })
};

module.exports = (env, args) => configs[args.mode || 'development'];