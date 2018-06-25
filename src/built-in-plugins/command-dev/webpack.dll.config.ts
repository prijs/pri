import * as crypto from 'crypto';
import * as path from 'path';
import * as webpack from 'webpack';
import * as WebpackBar from 'webpackbar';
import * as yargs from 'yargs';
import { globalState } from '../../utils/global-state';
import { plugin } from '../../utils/plugins';

interface IOptions {
  dllOutPath: string;
  dllFileName: string;
  dllMainfestName: string;
}

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false
};

export default (opts: IOptions) =>
  ({
    mode: 'development',

    entry: {
      library: plugin.devDllPipes.reduce((all, fn) => fn(all), [
        'react',
        'react-dom',
        'lodash',
        'dob',
        'dob-react',
        'antd',
        'antd/dist/antd.css',
        'highlight.js',
        'markdown-it',
        'react-loadable',
        'react-router',
        'styled-components',
        'history',
        'pri/client',

        /** include this will make hot load invaild! */
        // "react-hot-loader",

        // /** webpack */
        'sockjs-client/dist/sockjs.js',
        'html-entities'
      ])
    },

    output: {
      filename: opts.dllFileName,
      path: opts.dllOutPath,
      library: 'library'
    },

    plugins: [
      new webpack.DllPlugin({
        path: path.join(opts.dllOutPath, opts.dllMainfestName),
        name: 'library'
      }),
      new WebpackBar({
        name: 'dll'
      })
    ],

    module: {
      rules: [
        {
          test: /\.css/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },

    resolve: {
      modules: [
        // From project node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        // Self node_modules
        path.join(__dirname, '../../../node_modules')
      ],
      extensions: ['.js', '.jsx', '.tsx', '.ts', '.scss', '.less', '.css']
    },

    resolveLoader: {
      modules: [
        // From project node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        // Self node_modules
        path.join(__dirname, '../../../node_modules')
      ]
    },

    stats
  } as webpack.Configuration);
