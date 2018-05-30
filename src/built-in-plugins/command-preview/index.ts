import * as colors from 'colors';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as koaCompress from 'koa-compress';
import * as koaMount from 'koa-mount';
import * as koaStatic from 'koa-static';
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
import { log, spinner } from '../../utils/log';
import { getConfig } from '../../utils/project-config';
import text from '../../utils/text';
import { CommandBuild } from '../command-build';

const app = new Koa();

const projectRootPath = process.cwd();

export const CommandPreview = async (instance: typeof pri) => {
  const env = 'prod';
  const projectConfig = getConfig(projectRootPath, env);
  const distDir = path.join(projectRootPath, projectConfig.distDir);

  await CommandBuild(instance);

  const freePort = projectConfig.devPort || (await portfinder.getPortPromise());

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(
    koaMount(
      url.parse(projectConfig.publicPath).pathname,
      koaStatic(distDir, {
        gzip: true,
        setHeaders: (res: any) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      })
    )
  );

  const cssPath = path.join(distDir, 'main.css');
  const hasCssOutput = fs.existsSync(cssPath);

  if (projectConfig.useHttps) {
    await spinner('Create https server', async () =>
      https
        .createServer(generateCertificate(path.join(projectRootPath, '.temp/preview')), app.callback())
        .listen(freePort)
    );
  } else {
    await spinner('Create http server', async () => http.createServer(app.callback()).listen(freePort));
  }

  if (projectConfig.devUrl) {
    open(projectConfig.devUrl);
  } else {
    open(
      ensureEndWithSlash(
        urlJoin(`${projectConfig.useHttps ? 'https' : 'http'}://localhost:${freePort}`, projectConfig.baseHref)
      )
    );
  }
};

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: 'preview',
    description: text.commander.preview.description,
    action: () => CommandPreview(instance)
  });
};
