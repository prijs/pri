import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import * as path from 'path';
import * as webpack from 'webpack';
import * as yargs from 'yargs';
import { globalState, transferToAllAbsolutePaths as transferToAllAbsolutePathsWithPackages } from './global-state';
import { plugin } from './plugins';
import { srcPath, tempPath } from './structor-config';
import { getBabelOptions } from './babel-options';

export interface IHtmlTemplateArgs {
  dashboardServerPort?: number;
  libraryStaticPath?: string;
  appendHead?: string;
  appendBody?: string;
}

export type IOptions<T = {}> = {
  mode: 'development' | 'production';
  entryPath: string | string[];
  htmlTemplatePath?: string;
  htmlTemplateArgs?: IHtmlTemplateArgs;
  publicPath?: string;
  distDir?: string;
  outFileName?: string;
  outCssFileName?: string;
  externals?: any[];
  target?: webpack.Configuration['target'];
  libraryTarget?: webpack.LibraryTarget;
  devtool?: webpack.Options.Devtool;
} & T;

const defaultSourcePathToBeResolve = [
  ...transferToAllAbsolutePathsWithPackages(srcPath.dir),
  ...transferToAllAbsolutePathsWithPackages(tempPath.dir),
];

const selfAndProjectNodeModules = [
  path.join(globalState.projectRootPath, 'node_modules'),
  path.join(__dirname, '../../node_modules'),
];

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false,
};

const tsLoaderConfig = {
  include: plugin.buildConfigJsLoaderIncludePipes.reduce((options, fn) => {
    return fn(options);
  }, defaultSourcePathToBeResolve),
  exclude: plugin.buildConfigJsLoaderExcludePipes.reduce((options, fn) => {
    return fn(options);
  }, []),
};

const cssLoaderConfig = {
  include: defaultSourcePathToBeResolve,
};

// const scssLoaderConfig = {
//   include: plugin.buildConfigSassLoaderIncludePipes.reduce(
//     (options, fn) => fn(options),
//     defaultSourcePathToBeResolve
//   ),
//   exclude: plugin.buildConfigSassLoaderExcludePipes.reduce((options, fn) => fn(options), [])
// };

// const lessLoaderConfig = {
//   include: plugin.buildConfigLessLoaderIncludePipes.reduce(
//     (options, fn) => fn(options),
//     defaultSourcePathToBeResolve
//   ),
//   exclude: plugin.buildConfigLessLoaderExcludePipes.reduce((options, fn) => fn(options), [])
// };

/**
 * Get webpack config.
 */
export const getWebpackConfig = async (opts: IOptions) => {
  const distDir = opts.distDir || path.join(globalState.projectRootPath, globalState.sourceConfig.distDir);
  const outFileName = opts.outFileName || globalState.sourceConfig.outFileName;
  const outCssFileName = opts.outCssFileName || globalState.sourceConfig.outCssFileName;

  const styleLoader = {
    loader: 'style-loader',
    options: plugin.buildConfigStyleLoaderOptionsPipes.reduce((options, fn) => {
      return fn(options);
    }, {}),
  };

  const cssPureLoader = {
    loader: 'css-loader',
    options: plugin.buildConfigCssLoaderOptionsPipes.reduce((options, fn) => {
      return fn(options);
    }, {}),
  };

  const cssModuleLoader = {
    loader: 'css-loader',
    options: plugin.buildConfigCssLoaderOptionsPipes.reduce(
      (options, fn) => {
        return fn(options);
      },
      {
        importLoaders: 1,
        modules: {
          localIdentName: '[path][name]-[local]-[hash:base64:5]',
        },
      },
    ),
  };

  const sassLoader = {
    loader: 'sass-loader',
    options: plugin.buildConfigSassLoaderOptionsPipes.reduce((options, fn) => {
      return fn(options);
    }, {}),
  };

  const lessLoader = {
    loader: 'less-loader',
    options: plugin.buildConfigLessLoaderOptionsPipes.reduce((options, fn) => {
      return fn(options);
    }, {}),
  };

  const babelLoader = {
    loader: 'babel-loader',
    options: plugin.buildConfigBabelLoaderOptionsPipes.reduce((options, fn) => {
      return fn(options);
    }, getBabelOptions()),
  };

  const extraCssInProd = (...loaders: any[]) => {
    // Enable cssExtract, but not in bundle command.
    if (globalState.sourceConfig.cssExtract && yargs.argv._[0] !== 'bundle' && yargs.argv._[0] !== 'debug') {
      if (globalState.isDevelopment) {
        return [styleLoader, ...loaders];
      }
      return [MiniCssExtractPlugin.loader, ...loaders];
    }
    return [styleLoader, ...loaders];
  };

  let publicPath: string = opts.publicPath || globalState.sourceConfig.publicPath || '/';
  if (!publicPath.endsWith('/')) {
    publicPath += '/';
  }

  let { devtool } = opts;

  if (devtool === undefined) {
    devtool = opts.mode === 'development' ? 'eval-source-map' : false;
  }

  const config: webpack.Configuration = {
    mode: opts.mode,
    entry: opts.entryPath,
    devtool,
    externals: opts.externals,
    target: opts.target || 'web',
    output: {
      path: distDir,
      filename: outFileName,
      publicPath,
      chunkFilename: '[name].[hash].chunk.js',
      hotUpdateChunkFilename: 'hot~[id].[hash].chunk.js',
      hotUpdateMainFilename: 'hot-update.[hash].json',
      hashDigestLength: 4,
      globalObject: "(typeof self !== 'undefined' ? self : this)",
      libraryTarget: opts.libraryTarget || 'var',
    },
    module: {
      rules: [
        {
          test: /\.worker\.tsx?$/,
          use: [
            {
              loader: 'worker-loader',
              options: {
                inline: true,
              },
            },
          ],
          ...tsLoaderConfig,
        },
        {
          test: /\.tsx?$/,
          use: [babelLoader],
          ...tsLoaderConfig,
        },
        {
          test: /\.mdx?$/,
          use: [babelLoader, '@mdx-js/loader'],
          ...tsLoaderConfig,
        },
        {
          test: /\.css$/,
          use: extraCssInProd(cssPureLoader),
          exclude: [/\.module\.css$/],
        },
        {
          test: /\.module\.css$/,
          use: extraCssInProd(cssModuleLoader),
          ...cssLoaderConfig,
        },
        {
          test: /\.s[a|c]ss$/,
          use: extraCssInProd(cssPureLoader, sassLoader),
          include: plugin.buildConfigSassLoaderIncludePipes.reduce((options, fn) => {
            return fn(options);
          }, defaultSourcePathToBeResolve),
          exclude: plugin.buildConfigSassLoaderExcludePipes.reduce(
            (options, fn) => {
              return fn(options);
            },
            [/\.module\.s[a|c]ss$/],
          ),
        },
        {
          test: /\.module\.s[a|c]ss$/,
          use: extraCssInProd(cssModuleLoader, sassLoader),
          include: plugin.buildConfigSassLoaderIncludePipes.reduce((options, fn) => {
            return fn(options);
          }, defaultSourcePathToBeResolve),
          exclude: plugin.buildConfigSassLoaderExcludePipes.reduce((options, fn) => {
            return fn(options);
          }, []),
        },
        {
          test: /\.less$/,
          use: extraCssInProd(cssPureLoader, lessLoader),
          include: plugin.buildConfigLessLoaderIncludePipes.reduce((options, fn) => {
            return fn(options);
          }, defaultSourcePathToBeResolve),
          exclude: plugin.buildConfigLessLoaderExcludePipes.reduce(
            (options, fn) => {
              return fn(options);
            },
            [/\.module\.less$/],
          ),
        },
        {
          test: /\.module\.less$/,
          use: extraCssInProd(cssModuleLoader, lessLoader),
          include: plugin.buildConfigLessLoaderIncludePipes.reduce((options, fn) => {
            return fn(options);
          }, defaultSourcePathToBeResolve),
          exclude: plugin.buildConfigLessLoaderExcludePipes.reduce((options, fn) => {
            return fn(options);
          }, []),
        },
        { test: /\.html$/, use: ['raw-loader'] },
        {
          test: /\.(png|jpg|jpeg|gif|woff|woff2|eot|ttf|svg)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 1024 * 100,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      alias: {
        // Src alias to ./src
        ...(globalState.sourceConfig.type === 'project' && {
          src: path.join(globalState.projectRootPath, '/src'),
        }),
        // For react hot loader.
        ...(globalState.isDevelopment && {
          'react-dom': '@hot-loader/react-dom',
        }),
        // Packages alias names
        ...globalState.packages.reduce((obj, eachPackage) => {
          if (eachPackage.packageJson && eachPackage.packageJson.name) {
            return {
              ...obj,
              [eachPackage.packageJson.name]: path.join(eachPackage.rootPath, 'src'),
            };
          }
          return obj;
        }, {}),
      },
      extensions: [
        '.js',
        '.jsx',
        '.tsx',
        '.ts',
        '.md',
        '.mdx',
        '.scss',
        '.less',
        '.css',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        'woff',
        'woff2',
        'eot',
        'ttf',
        'svg',
      ],
    },
    resolveLoader: {
      modules: selfAndProjectNodeModules,
    },
    plugins: [],
    optimization: { namedChunks: false },
    stats,
  };

  if (globalState.isDevelopment) {
    if (opts.htmlTemplatePath) {
      config.plugins.push(
        new HtmlWebpackPlugin({
          title: globalState.sourceConfig.title || globalState.projectRootPath.split(path.sep).pop(),
          filename: 'index.html',
          template: opts.htmlTemplatePath,
          htmlTemplateArgs: opts.htmlTemplateArgs,
        }),
      );
    }
  }

  if (!globalState.isDevelopment) {
    if (globalState.sourceConfig.cssExtract && yargs.argv._[0] !== 'bundle' && yargs.argv._[0] !== 'debug') {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: outCssFileName,
        }),
      );
    }

    config.plugins.push(new OptimizeCssAssetsPlugin());
  }

  if (globalState.isDevelopment) {
    // Turn off performance hints during development.
    if (!config.performance) {
      config.performance = {};
    }
    config.performance.hints = false;
  }

  return plugin.buildConfigPipes.reduce(async (newConfig, fn) => {
    return fn(await newConfig);
  }, Promise.resolve(config));
};
