// eslint-disable-next-line import/no-extraneous-dependencies
import * as express from 'express';
import * as normalizePath from 'normalize-path';
import * as open from 'open';
import * as path from 'path';
import * as urlJoin from 'url-join';
import * as webpack from 'webpack';
import * as WebpackBar from 'webpackbar';
import * as CircularDependencyPlugin from 'circular-dependency-plugin';
import * as _ from 'lodash';
import * as WebpackDevServer from 'webpack-dev-server';
import { globalState } from './global-state';
import { tempPath } from './structor-config';
import { logInfo } from './log';
import { getWebpackConfig, IOptions } from './webpack-config';

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

  webpackConfig.plugins.push(
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      cwd: process.cwd(),
    }),
  );

  const webpackDevServerConfig: WebpackDevServer.Configuration = {
    host: '127.0.0.1',
    hot: opts.hot,
    hotOnly: opts.hot,
    publicPath: opts.publicPath,
    before: (app: any) => {
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
    headers: { 'Access-Control-Allow-Origin': '*' },
    clientLogLevel: 'warn',
    disableHostCheck: true,
    port: opts.devServerPort,
  } as any;

  WebpackDevServer.addDevServerEntrypoints(webpackConfig, webpackDevServerConfig);

  const compiler = webpack(webpackConfig);

  const devServer = new WebpackDevServer(compiler, webpackDevServerConfig);

  devServer.listen(opts.devServerPort, '127.0.0.1', () => {
    let devUrl: string = null;
    const localSuggestUrl = urlJoin(
      `${opts.https || globalState.sourceConfig.useHttps ? 'https' : 'http'}://localhost:${opts.devServerPort}`,
      globalState.sourceConfig.baseHref,
    );

    if (opts.devUrl === 'localhost') {
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
