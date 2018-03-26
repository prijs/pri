import * as ExtractTextPlugin from "extract-text-webpack-plugin"
import * as fs from "fs-extra"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as normalizePath from "normalize-path"
import * as path from "path"
// import * as PreloadWebpackPlugin from "preload-webpack-plugin"
import * as webpack from "webpack"
import * as yargs from "yargs"
import { initPlugins, plugin } from "../utils/plugins"
import { tempPath } from "../utils/structor-config"
import { getConfig } from "./project-config"

const projectRootPath = yargs.argv.env.projectRootPath

initPlugins(projectRootPath)

const entryPath = yargs.argv.env.entryPath
const env = yargs.argv.env.env
const htmlTemplatePath = yargs.argv.env.htmlTemplatePath
const htmlTemplateArgs = yargs.argv.env.htmlTemplateArgs
const devServerPort = yargs.argv.env.devServerPort

const projectConfig = getConfig(projectRootPath, env)

// Override variable
const argsPublicPath = yargs.argv.env.publicPath
const argsDistDir = yargs.argv.env.distDir
const argsDistFileName = yargs.argv.env.distFileName || "main"

const distDir = argsDistDir || path.join(projectRootPath, projectConfig.distDir)
const distFileName = argsDistFileName || projectConfig.distFileName

let publicPath: string = argsPublicPath || projectConfig.publicPath || "/"
if (!publicPath.endsWith("/")) {
  publicPath += "/"
}

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false
}

const babelPlugins: any = [["@babel/plugin-transform-runtime"]]

const config: webpack.Configuration = {
  entry: entryPath,

  output: {
    path: distDir,
    filename: distFileName + ".js",
    publicPath,
    chunkFilename: "[name].chunk.js",
    hotUpdateChunkFilename: "hot~[id].[hash:4].chunk.js",
    hotUpdateMainFilename: "hot-update.[hash:4].json"
  },

  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              babelrc: false,
              presets: [
                [
                  "env",
                  {
                    modules: false
                  }
                ],
                ["stage-2"]
              ],
              plugins: babelPlugins,
              comments: true
            }
          },
          "ts-loader"
        ]
      },
      {
        test: /\.css$/,
        use:
          env === "local"
            ? ["style-loader", "css-loader"]
            : ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: [
                  {
                    loader: "css-loader",
                    options: { minimize: true }
                  }
                ]
              })
      },
      {
        test: /\.scss$/,
        use:
          env === "local"
            ? ["style-loader", "css-loader", "sass-loader"]
            : ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: [
                  {
                    loader: "css-loader",
                    options: { minimize: true }
                  },
                  "sass-loader"
                ]
              })
      },
      {
        test: /\.less$/,
        use:
          env === "local"
            ? ["style-loader", "css-loader", "less-loader"]
            : ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: [
                  {
                    loader: "css-loader",
                    options: { minimize: true }
                  },
                  "less-loader"
                ]
              })
      }
    ]
  },

  resolve: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../node_modules")
    ],
    extensions: [".js", ".jsx", ".tsx", ".ts", ".scss", ".less", ".css"]
  },

  resolveLoader: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../node_modules")
    ]
  },

  plugins: [
    // new PreloadWebpackPlugin({
    //   rel: "prefetch"
    // })
  ],

  optimization: {
    namedChunks: false
  },

  stats,

  // Only for Devserver
  devServer: {
    contentBase: path.join(projectRootPath, tempPath.dir, "static"),
    compress: true,
    historyApiFallback: {
      rewrites: [
        {
          from: "/",
          to: normalizePath(path.join(publicPath, "index.html"))
        }
      ]
    },
    https: projectConfig.useHttps,
    open: true,
    overlay: {
      warnings: true,
      errors: true
    },
    port: devServerPort,
    stats,
    clientLogLevel: "warning"
  }
}

if (env === "local") {
  if (htmlTemplatePath) {
    config.plugins.push(
      new HtmlWebpackPlugin({
        title: "Pre Dev",
        filename: "index.html",
        template: htmlTemplatePath,
        htmlTemplateArgs
      })
    )
  }
}

if (env === "prod") {
  config.plugins.push(new ExtractTextPlugin(distFileName + ".css"))
}

if (env === "prod") {
  babelPlugins.push(["import", { libraryName: "antd" }])
}

export default plugin.buildConfigPipes.reduce((newConfig, fn) => fn(env, newConfig), config)
