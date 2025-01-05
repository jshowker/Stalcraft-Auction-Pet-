const path = require('path');

module.exports = {
    mode: 'development',
    entry: './main-process/renderer.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
    },
    resolve: {
        fallback: {
            fs: false,
            path: require.resolve('path-browserify'),
        },
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react'],
                    },
                },
            },
        ],
    },
    target: 'electron-renderer',
};
