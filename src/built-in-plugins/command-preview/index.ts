import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as open from 'opn';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as url from 'url';
import * as urlJoin from 'url-join';
import * as zlib from 'zlib';
import { pri } from '../../node';
import { ensureFiles } from '../../utils/ensure-files';
import { ensureEndWithSlash } from '../../utils/functional';
import { generateCertificate } from '../../utils/generate-certificate';
import { logText, spinner } from '../../utils/log';
import text from '../../utils/text';
import { buildProject } from '../command-build';

export const CommandPreview = async (instance: typeof pri) => {
  const Koa = require('koa');
  const koaCompress = require('koa-compress');
  const KoaMount = require('koa-mount');
  const KoaStatic = require('koa-static');

  const app = new Koa();

  const distDir = path.join(instance.projectRootPath, instance.projectConfig.distDir);

  await buildProject(instance);

  const freePort = instance.projectConfig.devPort || (await portfinder.getPortPromise());

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(
    KoaMount(
      url.parse(instance.projectConfig.publicPath).pathname,
      KoaStatic(distDir, {
        gzip: true,
        setHeaders: (res: any) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      })
    )
  );

  const cssPath = path.join(distDir, 'main.css');
  const hasCssOutput = fs.existsSync(cssPath);

  if (instance.projectConfig.useHttps) {
    await spinner('Create https server', async () =>
      https.createServer(generateCertificate(), app.callback()).listen(freePort)
    );
  } else {
    await spinner('Create http server', async () => http.createServer(app.callback()).listen(freePort));
  }

  if (instance.projectConfig.devUrl) {
    open(instance.projectConfig.devUrl);
  } else {
    open(
      ensureEndWithSlash(
        urlJoin(
          `${instance.projectConfig.useHttps ? 'https' : 'http'}://localhost:${freePort}`,
          instance.projectConfig.baseHref
        )
      )
    );
  }
};

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['preview'],
    description: text.commander.preview.description,
    action: () => CommandPreview(instance)
  });
};
