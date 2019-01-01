import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as socketIo from 'socket.io';
import * as yargs from 'yargs';
import * as zlib from 'zlib';
import { generateCertificate } from '../../../../utils/generate-certificate';
import { globalState } from '../../../../utils/global-state';
import { log } from '../../../../utils/log';
import { ProjectConfig } from '../../../../utils/project-config-interface';

interface IOptions {
  clientPort: number;
  serverPort: number;
  staticRootPath: string;
  hash: string;
}

export default (opts: IOptions) => {
  const Koa = require('koa');
  const koaCompress = require('koa-compress');
  const KoaCors = require('@koa/cors');
  const KoaMount = require('koa-mount');

  const app = new Koa();

  app.use(KoaCors());

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(KoaMount('/', KoaMount(opts.staticRootPath, { gzip: true })));

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
