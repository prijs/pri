import * as  ExtractTextPlugin from "extract-text-webpack-plugin"
import * as fs from "fs-extra"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as normalizePath from "normalize-path"
import * as path from "path"
import * as webpack from "webpack"
import * as yargs from "yargs"
import { getPlugins } from "./plugins"
import { getConfig } from "./project-config"

const projectRootPath = yargs.argv.env.projectRootPath
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

const plugins = getPlugins(projectRootPath)

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

const config: webpack.Configuration = {
  entry: entryPath,

  output: {
    path: distDir,
    filename: distFileName + ".js",
    publicPath,
    chunkFilename: "[id].chunk.js",
  },

  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/, use: [{
          loader: "babel-loader",
          options: {
            babelrc: false,
            presets: [
              ["env", {
                modules: false,
              }],
              ["stage-2"]
            ],
            plugins: [
              ["transform-runtime"],
              ["import", {
                libraryName: "antd"
              }]
            ],
            comments: true
          }
        }, "ts-loader"]
      },
      {
        test: /\.css$/,
        use: env === "local" ?
          ["style-loader", "css-loader"] :
          ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [{
              loader: "css-loader",
              options: { minimize: true }
            }]
          })
      },
      {
        test: /\.scss$/,
        use: env === "local" ?
          ["style-loader", "css-loader", "sass-loader"] :
          ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [{
              loader: "css-loader",
              options: { minimize: true }
            }, "sass-loader"]
          })
      },
      {
        test: /\.less$/,
        use: env === "local" ?
          ["style-loader", "css-loader", "less-loader"] :
          ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [{
              loader: "css-loader",
              options: { minimize: true }
            }, "less-loader"]
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

  plugins: [],

  stats,

  // Only for Devserver
  devServer: {
    historyApiFallback: {
      rewrites: [
        {
          from: "/",
          to: normalizePath(path.join(publicPath, "index.html"))
        }
      ]
    },
    https: true,
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

export default plugins.reduce((newConfig, plugin) => {
  if (plugin.instance.buildConfig) {
    return plugin.instance.buildConfig(newConfig)
  }
  return newConfig
}, config)
