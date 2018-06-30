import * as fs from 'fs-extra';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as path from 'path';
import * as webpack from 'webpack';
import { globalState } from '../utils/global-state';
import { plugin } from '../utils/plugins';
import { docsPath, pagesPath, srcPath, tempPath } from '../utils/structor-config';

interface IOptions {
  mode: 'development' | 'production';
  entryPath: string | string[];
  htmlTemplatePath?: string;
  htmlTemplateArgs?: {
    dashboardServerPort?: number;
    libraryStaticPath?: string;
  };
  publicPath?: string;
  distDir?: string;
  outFileName?: string;
  outCssFileName?: string;
}

/**
 * Get webpack config.
 */
export const getWebpackConfig = async (opts: IOptions) => {
  /**
   * Mutilpe loaders
   */
  const styleLoader = {
    loader: 'style-loader',
    options: plugin.buildConfigStyleLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const cssLoader = {
    loader: 'css-loader',
    options: plugin.buildConfigCssLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const sassLoader = {
    loader: 'sass-loader',
    options: plugin.buildConfigSassLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const lessLoader = {
    loader: 'less-loader',
    options: plugin.buildConfigLessLoaderOptionsPipes.reduce((options, fn) => fn(options), {})
  };

  const babelLoader = {
    loader: 'babel-loader',
    options: plugin.buildConfigBabelLoaderOptionsPipes.reduce((options, fn) => fn(options), {
      babelrc: false,
      presets: [['@babel/env', { modules: false }], ['@babel/stage-2', { decoratorsLegacy: true }]],
      plugins: [['@babel/plugin-transform-runtime']],
      comments: true
    })
  };

  const tsLoader = {
    loader: 'ts-loader',
    options: plugin.buildConfigTsLoaderOptionsPipes.reduce((options, fn) => fn(options), {
      happyPackMode: true
    })
  };

  /**
   * Helper
   */
  function extraCssInProd(...loaders: any[]) {
    if (globalState.isDevelopment) {
      return [styleLoader, ...loaders];
    } else {
      return [MiniCssExtractPlugin.loader, ...loaders];
    }
  }

  const distDir = opts.distDir || path.join(globalState.projectRootPath, globalState.projectConfig.distDir);
  const outFileName = opts.outFileName || globalState.projectConfig.outFileName;
  const outCssFileName = opts.outCssFileName || globalState.projectConfig.outCssFileName;

  let publicPath: string = opts.publicPath || globalState.projectConfig.publicPath || '/';
  if (!publicPath.endsWith('/')) {
    publicPath += '/';
  }

  const stats = { warnings: false, version: false, modules: false, entrypoints: false, hash: false };

  const defaultSourcePathToBeResolve = [
    path.join(globalState.projectRootPath, srcPath.dir),
    path.join(globalState.projectRootPath, pagesPath.dir),
    path.join(globalState.projectRootPath, tempPath.dir)
  ];

  const config: webpack.Configuration = {
    mode: opts.mode,
    entry: opts.entryPath,
    output: {
      path: distDir,
      filename: outFileName,
      publicPath,
      chunkFilename: '[name].[hash].chunk.js',
      hotUpdateChunkFilename: 'hot~[id].[hash].chunk.js',
      hotUpdateMainFilename: 'hot-update.[hash].json',
      hashDigestLength: 4
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts)?$/,
          use: [babelLoader, tsLoader],
          include: plugin.buildConfigTsLoaderIncludePipes.reduce(
            (options, fn) => fn(options),
            defaultSourcePathToBeResolve
          ),
          exclude: plugin.buildConfigTsLoaderExcludePipes.reduce((options, fn) => fn(options), [])
        },
        { test: /\.css$/, use: extraCssInProd(cssLoader) },
        {
          test: /\.scss$/,
          use: extraCssInProd(cssLoader, sassLoader),
          include: plugin.buildConfigSassLoaderIncludePipes.reduce(
            (options, fn) => fn(options),
            defaultSourcePathToBeResolve
          ),
          exclude: plugin.buildConfigSassLoaderExcludePipes.reduce((options, fn) => fn(options), [])
        },
        {
          test: /\.less$/,
          use: extraCssInProd(cssLoader, lessLoader),
          include: plugin.buildConfigLessLoaderIncludePipes.reduce(
            (options, fn) => fn(options),
            defaultSourcePathToBeResolve
          ),
          exclude: plugin.buildConfigLessLoaderExcludePipes.reduce((options, fn) => fn(options), [])
        },
        { test: /\.html$/, use: ['raw-loader'] }
      ]
    },
    resolve: {
      modules: [
        // From project node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        path.join(__dirname, '../../node_modules')
      ],
      extensions: ['.js', '.jsx', '.tsx', '.ts', '.scss', '.less', '.css']
    },
    resolveLoader: {
      modules: [
        // From project node_modules
        // Self node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        path.join(__dirname, '../../node_modules')
      ]
    },
    plugins: [],
    optimization: { namedChunks: false },
    stats
  };

  if (globalState.isDevelopment) {
    if (opts.htmlTemplatePath) {
      config.plugins.push(
        new HtmlWebpackPlugin({
          title: 'Pre Dev',
          filename: 'index.html',
          template: opts.htmlTemplatePath,
          htmlTemplateArgs: opts.htmlTemplateArgs
        })
      );
    }
  }

  if (!globalState.isDevelopment) {
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      cacheGroups: { styles: { name: outCssFileName, test: /\.css$/, chunks: 'all', enforce: true } }
    };
    config.plugins.push(new MiniCssExtractPlugin({ filename: outCssFileName }));

    babelLoader.options.plugins.push(['import', { libraryName: 'antd' }]);
    cssLoader.options.minimize = true;
  }

  if (globalState.isDevelopment) {
    // Turn off performance hints during development.
    if (!config.performance) {
      config.performance = {};
    }
    config.performance.hints = false;
  }

  return plugin.buildConfigPipes.reduce(async (newConfig, fn) => fn(await newConfig), Promise.resolve(config));
};
