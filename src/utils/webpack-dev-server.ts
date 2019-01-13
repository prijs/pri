import * as express from 'express';
import * as normalizePath from 'normalize-path';
import * as open from 'opn';
import * as path from 'path';
import * as urlJoin from 'url-join';
import * as webpack from 'webpack';
import * as webpackDevServer from 'webpack-dev-server';
import * as WebpackBar from 'webpackbar';
import { globalState } from '../utils/global-state';
import { tempPath } from '../utils/structor-config';
import { getWebpackConfig, IHtmlTemplateArgs, IOptions } from './webpack-config';

interface IExtraOptions {
  pipeConfig?: (config?: webpack.Configuration) => webpack.Configuration;
  devServerPort: number;
  publicPath: string;
  webpackBarOptions?: any;
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
  const { pipeConfig, devServerPort, publicPath, webpackBarOptions, ...others } = opts;

  let webpackConfig = await getWebpackConfig(others);

  if (opts.pipeConfig) {
    webpackConfig = opts.pipeConfig(webpackConfig);
  }

  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  webpackConfig.plugins.push(new WebpackBar(opts.webpackBarOptions));

  const webpackDevServerConfig: webpackDevServer.Configuration = {
    host: '127.0.0.1',
    hot: true,
    hotOnly: true,
    publicPath: opts.publicPath,
    before: (app: any) => {
      app.use('/', express.static(path.join(globalState.projectRootPath, tempPath.dir, 'static')));
    },
    compress: true,
    historyApiFallback: { rewrites: [{ from: '/', to: normalizePath(path.join(opts.publicPath, 'index.html')) }] },
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

  webpackDevServer.addDevServerEntrypoints(webpackConfig, webpackDevServerConfig);
  const compiler = webpack(webpackConfig);

  const devServer = new webpackDevServer(compiler, webpackDevServerConfig);

  devServer.listen(opts.devServerPort, '127.0.0.1', () => {
    if (globalState.projectConfig.devUrl) {
      open(globalState.projectConfig.devUrl);
    } else {
      open(
        urlJoin(
          `${globalState.projectConfig.useHttps ? 'https' : 'http'}://localhost:${opts.devServerPort}`,
          globalState.projectConfig.baseHref
        )
      );
    }
  });
};
