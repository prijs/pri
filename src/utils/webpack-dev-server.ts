// eslint-disable-next-line import/no-extraneous-dependencies
import * as express from 'express';
import * as normalizePath from 'normalize-path';
import * as open from 'open';
import * as path from 'path';
import * as urlJoin from 'url-join';
import * as webpack from 'webpack';
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
}

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false,
  colors: true,
  children: false
};

export const runWebpackDevServer = async (opts: IOptions<IExtraOptions>) => {
  let webpackConfig = await getWebpackConfig(opts);

  if (opts.pipeConfig) {
    webpackConfig = await opts.pipeConfig(webpackConfig);
  }

  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

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
      historyApiFallback: { rewrites: [{ from: '/', to: normalizePath(path.join(opts.publicPath, 'index.html')) }] }
    }),
    https: globalState.projectConfig.useHttps,
    overlay: { warnings: true, errors: true },
    stats,
    watchOptions: {
      ...(!globalState.projectConfig.watchNodeModules && {
        ignored: /node_modules/
      })
    },
    headers: { 'Access-Control-Allow-Origin': '*' },
    clientLogLevel: 'warning',
    disableHostCheck: true,
    port: opts.devServerPort
  } as any;

  WebpackDevServer.addDevServerEntrypoints(webpackConfig, webpackDevServerConfig);
  const compiler = webpack(webpackConfig);

  const devServer = new WebpackDevServer(compiler, webpackDevServerConfig);

  devServer.listen(opts.devServerPort, '127.0.0.1', () => {
    let devUrl = '';

    if (opts.devUrl) {
      ({ devUrl } = opts);
    } else if (globalState.projectConfig.devUrl) {
      ({ devUrl } = globalState.projectConfig);
    } else {
      devUrl = urlJoin(
        `${globalState.projectConfig.useHttps ? 'https' : 'http'}://localhost:${opts.devServerPort}`,
        globalState.projectConfig.baseHref
      );
    }

    logInfo(`Serve on ${devUrl}`);

    if (opts.autoOpenBrowser) {
      open(devUrl);
    }
  });
};
