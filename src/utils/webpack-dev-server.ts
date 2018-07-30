import * as history from 'connect-history-api-fallback';
import * as koaCompress from 'koa-compress';
import * as convert from 'koa-connect';
import * as koaMount from 'koa-mount';
import * as koaStatic from 'koa-static';
import * as normalizePath from 'normalize-path';
import * as open from 'opn';
import * as path from 'path';
import * as urlJoin from 'url-join';
import * as webpack from 'webpack';
import * as webpackServe from 'webpack-serve';
import * as webpackServeWaitpage from 'webpack-serve-waitpage';
import { globalState } from '../utils/global-state';
import { generateCertificate } from './generate-certificate';
import { tempPath } from './structor-config';
import { getWebpackConfig } from './webpack-config';

interface IOptions {
  entryPath: string;
  htmlTemplatePath: string;
  devServerPort: number;
  publicPath: string;
  distDir?: string;
  outFileName?: string;
  htmlTemplateArgs?: {
    dashboardServerPort?: number;
    libraryStaticPath?: string;
    appendBody?: string;
  };
  pipeConfig?: (config?: webpack.Configuration) => webpack.Configuration;
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

export const runWebpackDevServer = async (opts: IOptions) => {
  let webpackConfig = await getWebpackConfig({
    mode: 'development',
    entryPath: [opts.entryPath],
    htmlTemplatePath: opts.htmlTemplatePath,
    htmlTemplateArgs: opts.htmlTemplateArgs,
    publicPath: opts.publicPath,
    distDir: opts.distDir,
    outFileName: opts.outFileName
  });

  if (opts.pipeConfig) {
    webpackConfig = opts.pipeConfig(webpackConfig);
  }

  const compiler = webpack(webpackConfig);

  webpackServe(
    {},
    {
      host: '127.0.0.1',
      hotClient: true,
      devMiddleware: {
        publicPath: opts.publicPath,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        stats,
        watchOptions: { ignored: /node_modules/ }
      },
      https: globalState.projectConfig.useHttps ? generateCertificate() : null,
      port: opts.devServerPort,
      add: (app: any, middleware: any, options: any) => {
        app.use(koaCompress());
        app.use(
          webpackServeWaitpage(options, {
            theme: 'dark'
          })
        );

        app.use(
          koaMount('/', koaStatic(path.join(globalState.projectRootPath, tempPath.dir, 'static'), { gzip: true }))
        );

        app.use(
          convert(
            history({
              rewrites: [
                {
                  from: '/',
                  to: (ctx: any) => {
                    if (ctx.parsedUrl.path.indexOf('.js') > -1 || ctx.parsedUrl.path.indexOf('.css') > -1) {
                      return ctx.parsedUrl.href;
                    }
                    return normalizePath(path.join(opts.publicPath, 'index.html'));
                  }
                }
              ]
            })
          )
        );
      },
      compiler,
      on: {
        listening: () => {
          const openUrl = globalState.projectConfig.devUrl
            ? globalState.projectConfig.devUrl
            : urlJoin(`${globalState.projectConfig.useHttps ? 'https' : 'http'}://localhost:${opts.devServerPort}`);
          open(openUrl);
        }
      }
    }
  );
};
