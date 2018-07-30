import * as koaCors from '@koa/cors';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as koaCompress from 'koa-compress';
import * as koaMount from 'koa-mount';
import * as koaStatic from 'koa-static';
import * as path from 'path';
import * as socketIo from 'socket.io';
import * as yargs from 'yargs';
import * as zlib from 'zlib';
import { generateCertificate } from '../../../../utils/generate-certificate';
import { globalState } from '../../../../utils/global-state';
import { log } from '../../../../utils/log';
import { ProjectConfig } from '../../../../utils/project-config-interface';

const app = new Koa();

interface IOptions {
  clientPort: number;
  serverPort: number;
  staticRootPath: string;
  hash: string;
}

export default (opts: IOptions) => {
  app.use(koaCors());

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(koaMount('/', koaStatic(opts.staticRootPath, { gzip: true })));

  app.use(async ctx => {
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
