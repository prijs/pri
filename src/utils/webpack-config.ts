import * as ExtractTextPlugin from "extract-text-webpack-plugin"
import * as fs from "fs-extra"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as path from "path"
import * as webpack from "webpack"
import { plugin } from "../utils/plugins"
import { IProjectConfig } from "../utils/project-config-interface"

interface IOptions {
  mode: "development" | "production"
  projectRootPath: string
  entryPath: string | string[]
  env: "local" | "prod"
  htmlTemplatePath?: string
  htmlTemplateArgs?: {
    dashboardServerPort?: number
    libraryStaticPath?: string
  }
  projectConfig: IProjectConfig
  publicPath?: string
  distDir?: string
  distFileName?: string
}

export const getWebpackConfig = (opts: IOptions) => {
  const distDir = opts.distDir || path.join(opts.projectRootPath, opts.projectConfig.distDir)
  const distFileName = opts.distFileName || opts.projectConfig.distFileName

  let publicPath: string = opts.publicPath || opts.projectConfig.publicPath || "/"
  if (!publicPath.endsWith("/")) {
    publicPath += "/"
  }

  const stats = { warnings: false, version: false, modules: false, entrypoints: false, hash: false }

  const babelPlugins: any = [["@babel/plugin-transform-runtime"]]

  const config: webpack.Configuration = {
    mode: opts.mode,
    entry: opts.entryPath,
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
                presets: [["@babel/env", { modules: false }], ["@babel/stage-2"]],
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
            opts.env === "local"
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
            opts.env === "local"
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
            opts.env === "local"
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
        path.join(opts.projectRootPath, "node_modules"), // Self node_modules
        path.join(__dirname, "../../node_modules")
      ],
      extensions: [".js", ".jsx", ".tsx", ".ts", ".scss", ".less", ".css"]
    },
    resolveLoader: {
      modules: [
        // From project node_modules
        path.join(opts.projectRootPath, "node_modules"), // Self node_modules
        path.join(__dirname, "../../node_modules")
      ]
    },
    plugins: [
      // new PreloadWebpackPlugin({
      //   rel: "prefetch"
      // })
    ],
    optimization: { namedChunks: false },
    stats
  }

  if (opts.env === "local") {
    if (opts.htmlTemplatePath) {
      config.plugins.push(
        new HtmlWebpackPlugin({
          title: "Pre Dev",
          filename: "index.html",
          template: opts.htmlTemplatePath,
          htmlTemplateArgs: opts.htmlTemplateArgs
        })
      )
    }
  }

  if (opts.env === "prod") {
    config.plugins.push(new ExtractTextPlugin(distFileName + ".css"))
  }

  if (opts.env === "prod") {
    babelPlugins.push(["import", { libraryName: "antd" }])
  }

  return plugin.buildConfigPipes.reduce((newConfig, fn) => fn(opts.env, newConfig), config)
}
