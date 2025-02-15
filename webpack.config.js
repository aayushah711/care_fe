const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");
const MomentLocalesPlugin = require("moment-locales-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const safePostCssParser = require("postcss-safe-parser");

const prodPlugins = (isDev) => {
  if (isDev) {
    return [];
  }

  return [
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 7340032,
      exclude: ["build-meta.json", /\.map$/],
    }),
  ];
};

module.exports = (env, argv) => {
  const mode = argv.mode || "development";
  const isDev = mode !== "production";
  const app = ["./src/index.tsx"];
  if (isDev) {
    app.push("webpack-dev-server/client");
  }
  return {
    entry: {
      vendor: ["react", "react-dom"],
      app,
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isDev ? "js/bundle.[hash].js" : "js/bundle.prod.[hash].js",
      chunkFilename: "[name].[chunkhash].chunk.js",
      publicPath: "/",
    },
    optimization: {
      moduleIds: "hashed",
      splitChunks: isDev
        ? false
        : {
            cacheGroups: {
              commons: {
                test: /[\\/]node_modules[\\/]/,
                name: false,
                chunks: "all",
              },
            },
          },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`,
      },
    },
    devtool: isDev ? "eval-cheap-module-source-map" : "none",
    mode,
    resolve: {
      extensions: [".js", ".jsx", ".json", ".ts", ".tsx", ".manifest"],
    },
    devServer: {
      contentBase: path.join(__dirname, "dist"),
      compress: true,
      writeToDisk: true,
      host: "0.0.0.0",
      port: 4000,
      proxy: {
        "/api": {
          target: "https://careapi.coronasafe.in/",
          changeOrigin: true,
        },
      },
      historyApiFallback: true,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          include: [path.resolve(__dirname, "src")],
          loader: "ts-loader",
        },
        {
          enforce: "pre",
          test: /\.js$/,
          loader: "source-map-loader",
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
        },
        {
          test: /\.(png|jpe?g|gif)$/i,
          use: [
            {
              loader: "file-loader",
            },
          ],
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: "public/manifest.webmanifest",
            to: "manifest.webmanifest",
          },
          {
            from: "public/robots.txt",
            to: "robots.txt",
          },
          {
            from: "public/favicon.ico",
            to: "favicon.ico",
          },
          {
            from: "public/contribute.json",
            to: "contribute.json",
          },
          {
            // build meata contains version no for latest build. check "generate-build-meta" package script
            from: "public/build-meta.json",
            to: "build-meta.json",
            noErrorOnMissing: isDev,
          },
        ],
      }),
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "src", "index.html"),
        title: "Coronasafe Care",
        minify: isDev
          ? false
          : {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: false,
        },
        cssProcessorPluginOptions: {
          preset: ["default", { minifyFontValues: { removeQuotes: false } }],
        },
      }),

      new webpack.HotModuleReplacementPlugin(),
      new MomentLocalesPlugin(),
      new MiniCssExtractPlugin({
        filename: isDev
          ? "css/[name][hash].bundle.css"
          : "css/[name][hash].prod.bundle.css",
      }),
      ...prodPlugins(isDev),
    ],
    performance: false,
  };
};
