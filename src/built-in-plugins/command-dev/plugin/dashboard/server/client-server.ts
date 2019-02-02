import * as KoaCors from '@koa/cors';
import * as http from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as KoaCompress from 'koa-compress';
import * as KoaMount from 'koa-mount';
import * as KoaStatic from 'koa-static';
import * as zlib from 'zlib';
import { generateCertificate } from '../../../../../utils/generate-certificate';
import { globalState } from '../../../../../utils/global-state';

interface IOptions {
  clientPort: number;
  serverPort: number;
  staticRootPath: string;
  hash: string;
}

export default (opts: IOptions) => {
  const app = new Koa();

  app.use(KoaCors());

  app.use(KoaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(KoaMount('/', KoaStatic(opts.staticRootPath, { gzip: true })));

  app.use(async (ctx: any) => {
    ctx.set('Content-Type', 'text/html; charset=utf-8');

    ctx.body = `
    <html>

    <head>
      <style>
        html,
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>

    <body>
      <div id="root"></div>
      <script>
        window.serverPort = ${opts.serverPort}
      </script>
      <script src="/dlls/main.dll.js"></script>
      <script src="/dashboard-bundle/main.${opts.hash}.js"></script>
    </body>

    </html>
  `;
  });

  if (globalState.projectConfig.useHttps) {
    https.createServer(generateCertificate(), app.callback()).listen(opts.clientPort);
  } else {
    http.createServer(app.callback()).listen(opts.clientPort);
  }
};
