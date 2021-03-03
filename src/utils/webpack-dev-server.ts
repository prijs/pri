// eslint-disable-next-line import/no-extraneous-dependencies
import * as express from 'express';
import * as normalizePath from 'normalize-path';
import * as open from 'open';
import * as path from 'path';
import * as urlJoin from 'url-join';
import * as yargs from 'yargs';
import * as webpack from 'webpack';
import * as WebpackBar from 'webpackbar';
import * as CircularDependencyPlugin from 'circular-dependency-plugin';
import * as _ from 'lodash';
import * as WebpackDevServer from 'webpack-dev-server';
import * as SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { globalState } from './global-state';
import { tempPath } from './structor-config';
import { logInfo } from './log';
import { getWebpackConfig, IOptions } from './webpack-config';
import { pri } from '../node';

const smp = new SpeedMeasurePlugin();

interface IExtraOptions {
  pipeConfig?: (config?: webpack.Configuration) => Promise<webpack.Configuration>;
  devServerPort: number;
  publicPath: string;
  jsOnly?: boolean;
  hot?: boolean;
  devUrl?: string;
  autoOpenBrowser?: boolean;
  https?: boolean;
}

const stats = {
  warnings: true,
  assets: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false,
  colors: true,
  children: false,
};

export const runWebpackDevServer = async (opts: IOptions<IExtraOptions>) => {
  let webpackConfig = await getWebpackConfig(opts);

  if (opts.pipeConfig) {
    webpackConfig = await opts.pipeConfig(webpackConfig);
  }

  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

  webpackConfig.plugins.push(new WebpackBar());

  // If set open in project config, perform a circular dependency check
  if (globalState.projectConfig.circularDetect?.enable) {
    const exclude = globalState.projectConfig.circularDetect?.exclude;
    webpackConfig.plugins.push(
      new CircularDependencyPlugin({
        exclude: exclude ? new RegExp(exclude) : /node_modules/,
        cwd: process.cwd(),
      }),
    );
  }

  if (!yargs.argv.skipTypeCheck) {
    webpackConfig.plugins.push(
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          memoryLimit: 8192,
          mode: 'write-references',
        },
      }),
    );
  }

  const webpackDevServerConfig: WebpackDevServer.Configuration = {
    host: pri.sourceConfig.host,
    hot: opts.hot,
    hotOnly: opts.hot,
    publicPath: opts.publicPath,
    before: (app: any) => {
      app.use((req: any, res: any, next: any) => {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        next();
      });
      app.use('/', express.static(path.join(globalState.projectRootPath, tempPath.dir, 'static')));
    },
    compress: true,
    ...(!opts.jsOnly && {
      historyApiFallback: { rewrites: [{ from: '/', to: normalizePath(path.join(opts.publicPath, 'index.html')) }] },
    }),
    https: _.defaults({ value: opts.https }, { value: globalState.sourceConfig.useHttps }).value,
    overlay: { warnings: false, errors: true },
    stats,
    watchOptions: {
      ...(!globalState.sourceConfig.watchNodeModules && {
        ignored: /node_modules/,
      }),
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization, x-csrf-token',
    },
    clientLogLevel: 'warn',
    disableHostCheck: true,
    port: opts.devServerPort,
  } as any;

  WebpackDevServer.addDevServerEntrypoints(webpackConfig as any, webpackDevServerConfig);

  if (yargs.argv.measureSpeed) {
    webpackConfig = smp.wrap(webpackConfig);
  }

  const compiler = webpack(webpackConfig);

  const devServer = new WebpackDevServer(compiler as any, webpackDevServerConfig);

  devServer.listen(opts.devServerPort, pri.sourceConfig.host, () => {
    let devUrl: string = null;
    const localSuggestUrl = urlJoin(
      `${opts.https || globalState.sourceConfig.useHttps ? 'https' : 'http'}://${pri.sourceConfig.host}:${
        opts.devServerPort
      }`,
      globalState.sourceConfig.baseHref,
    );

    if (opts.devUrl === pri.sourceConfig.host) {
      devUrl = localSuggestUrl;
    } else if (opts.devUrl !== undefined) {
      ({ devUrl } = opts);
    } else if (globalState.sourceConfig.devUrl !== undefined && globalState.sourceConfig.devUrl !== null) {
      ({ devUrl } = globalState.sourceConfig);
    } else {
      devUrl = localSuggestUrl;
    }

    logInfo(`Serve on ${devUrl}`);

    if (opts.autoOpenBrowser && devUrl) {
      open(devUrl);
    }
  });
};
