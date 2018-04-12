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

/**
 * Mutilpe loaders
 */
const styleLoader = {
  loader: "style-loader",
  options: plugin.buildConfigStyleLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
}

const cssLoader = {
  loader: "css-loader",
  options: plugin.buildConfigCssLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
}

const sassLoader = {
  loader: "sass-loader",
  options: plugin.buildConfigSassLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
}

const lessLoader = {
  loader: "less-loader",
  options: plugin.buildConfigLessLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
}

const babelLoader = {
  loader: "babel-loader",
  options: plugin.buildConfigBabelLoaderOptionsPipes.reduce((options, fn) => fn(options), {
    babelrc: false,
    presets: [["@babel/env", { modules: false }], ["@babel/stage-2"]],
    plugins: [["@babel/plugin-transform-runtime"]],
    comments: true
  })
}

const tsLoader = {
  loader: "ts-loader",
  options: plugin.buildConfigTsLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
}

/**
 * Get webpack config.
 */
export const getWebpackConfig = (opts: IOptions) => {
  /**
   * Helper
   */
  function extraCssInProd(...loaders: any[]) {
    if (opts.env === "local") {
      return loaders
    } else {
      return ExtractTextPlugin.extract({ fallback: styleLoader, use: loaders })
    }
  }

  const distDir = opts.distDir || path.join(opts.projectRootPath, opts.projectConfig.distDir)
  const distFileName = opts.distFileName || opts.projectConfig.distFileName

  let publicPath: string = opts.publicPath || opts.projectConfig.publicPath || "/"
  if (!publicPath.endsWith("/")) {
    publicPath += "/"
  }

  const stats = { warnings: false, version: false, modules: false, entrypoints: false, hash: false }

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
          use: [babelLoader, tsLoader]
        },
        {
          test: /\.css$/,
          use: extraCssInProd(cssLoader)
        },
        {
          test: /\.scss$/,
          use: extraCssInProd(cssLoader, sassLoader)
        },
        {
          test: /\.less$/,
          use: extraCssInProd(cssLoader, lessLoader)
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
    babelLoader.options.plugins.push(["import", { libraryName: "antd" }])
    cssLoader.options.minimize = true
  }

  return plugin.buildConfigPipes.reduce((newConfig, fn) => fn(opts.env, newConfig), config)
}
