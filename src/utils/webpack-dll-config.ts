import * as path from 'path';
import * as webpack from 'webpack';
import * as WebpackBar from 'webpackbar';
import { PRI_PACKAGE_NAME } from './constants';
import { globalState } from './global-state';
import { plugin } from './plugins';

export interface IDllOptions {
  dllOutPath: string;
  dllFileName: string;
  dllMainfestName: string;
  pipeConfig?: (config?: webpack.Configuration) => Promise<webpack.Configuration>;
}

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false,
};

const vendors = [
  'react',
  'react-dom',
  'lodash',
  'highlight.js',
  'react-router',
  'history',
  `${PRI_PACKAGE_NAME}/client`,
  ...(globalState.sourceConfig.extraVendors ?? []),
];

export const getWebpackDllConfig = (opts: IDllOptions) => {
  const result: webpack.Configuration = {
    mode: 'development',

    entry: {
      library: plugin.devDllPipes.reduce((all, fn) => {
        return fn(all);
      }, vendors),
    },

    output: {
      filename: opts.dllFileName,
      path: opts.dllOutPath,
      library: 'library',
    },

    plugins: [
      new webpack.DllPlugin({
        path: path.join(opts.dllOutPath, opts.dllMainfestName),
        name: 'library',
      }),
      new WebpackBar(),
    ],

    module: {
      rules: [
        {
          test: /\.css/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    resolve: {
      modules: [
        // From project node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        // Self node_modules
        path.join(__dirname, '../../../node_modules'),
      ],
      extensions: ['.js', '.jsx', '.tsx', '.ts', '.scss', '.less', '.css', 'json'],
    },

    resolveLoader: {
      modules: [
        // From project node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        // Self node_modules
        path.join(__dirname, '../../node_modules'),
      ],
    },

    stats,
  };

  return result;
};
