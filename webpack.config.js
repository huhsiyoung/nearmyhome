const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    mode: 'production',
    context: path.resolve(__dirname, 'src/frontend'),
    entry: {
        'map-search': './js/map-search.js'
    },
    output: {
        path: path.resolve(__dirname, 'src/main/resources/static'),
        filename: 'js/[name].bundle.js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].[ext]',
                        }
                    },
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            optipng: { enabled: true },
                            pngquant: {
                                quality: [0.65, 0.90],
                                speed: 4
                            },
                            svgo: {
                                plugins: [
                                    {
                                        name: 'removeViewBox',
                                        active: false
                                    }
                                ]
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(woff2?|ttf|eot)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'font/[name][ext]'
                }
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].css'
        })
    ]
}