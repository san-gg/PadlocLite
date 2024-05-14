const { resolve, join } = require("path");
const { EnvironmentPlugin, optimize } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const rootDir = resolve(__dirname, "../..");
const assetsDir = resolve(rootDir, process.env.PL_ASSETS_DIR || "assets");
const { version } = require(resolve(__dirname, "package.json"));
const { name, description, author, scheme, terms_of_service } = require(join(assetsDir, "manifest.json"));

module.exports = [
    {
        target: "electron-renderer",
        entry: resolve(__dirname, "src/index.ts"),
        output: {
            path: resolve(__dirname, "app/app"),
            filename: "index.js",
            chunkFilename: "index.chunk.js",
        },
        mode: "development",
        devtool: "source-map",
        stats: "minimal",
        resolve: {
            extensions: [".ts", ".js", ".css", ".svg", ".png", ".jpg"],
            alias: {
                assets: resolve(__dirname, assetsDir),
            },
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
                    use: ["file-loader"],
                },
                {
                    test: /\.txt|md$/i,
                    use: "raw-loader",
                },
            ],
        },
        plugins: [
            new EnvironmentPlugin({
                PL_SUPPORT_EMAIL: "support@padloc.app",
                PL_VERSION: version,
                PL_VENDOR_VERSION: version,
                PL_AUTH_DEFAULT_TYPE: null,
                PL_APP_NAME: name,
                PL_TERMS_OF_SERVICE: terms_of_service,
            }),
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                title: name,
                template: resolve(__dirname, "src/index.html"),
                meta: {
                    "Content-Security-Policy": {
                        "http-equiv": "Content-Security-Policy",
                        content: `default-src 'self' https://api.pwnedpasswords.com blob:; style-src 'self' 'unsafe-inline'; object-src 'self' blob:; frame-src 'self'; img-src 'self' blob: data: https:;`,
                    },
                },
            }),
            new optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
        ],
    },
    {
        target: "electron-main",
        entry: {
            main: resolve(__dirname, "src/main.ts"),
        },
        output: {
            path: resolve(__dirname, "app"),
            filename: "[name].js",
            chunkFilename: "[name].chunk.js",
        },
        mode: "development",
        devtool: "source-map",
        stats: "minimal",
        resolve: {
            extensions: [".ts", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                },
            ],
        },
        plugins: [
            new EnvironmentPlugin({
                PL_APP_SCHEME: scheme,
                PL_APP_NAME: name,
                PL_VENDOR_VERSION: version,
                PL_TERMS_OF_SERVICE: terms_of_service,
            }),
            {
                apply(compiler) {
                    const package = JSON.stringify({
                        name,
                        description,
                        version: process.env.PL_VENDOR_VERSION || version,
                        author,
                        main: "main.js",
                    });
                    // emit is asynchronous hook, tapping into it using tapAsync, you can use tapPromise/tap(synchronous) as well
                    compiler.hooks.emit.tapPromise("InjectAppPackage", async (compilation, callback) => {
                        // Insert this list into the webpack build as a new file asset:
                        compilation.assets["package.json"] = {
                            source: () => package,
                            size: () => package.length,
                        };
                    });
                },
            },
        ],
    },
];
