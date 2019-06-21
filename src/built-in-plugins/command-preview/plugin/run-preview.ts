import * as http from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as KoaCompress from 'koa-compress';
import * as KoaMount from 'koa-mount';
import * as KoaStatic from 'koa-static';
import * as open from 'open';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as url from 'url';
import * as urlJoin from 'url-join';
import * as zlib from 'zlib';
import { pri } from '../../../node';
import { ensureEndWithSlash } from '../../../utils/functional';
import { generateCertificate } from '../../../utils/generate-certificate';
import { spinner } from '../../../utils/log';
import { buildProject } from '../../command-build/plugin/build';

export const CommandPreview = async () => {
  const app = new Koa();

  const distDir = path.join(pri.projectRootPath, pri.projectConfig.distDir);

  await buildProject();

  const freePort = pri.projectConfig.devPort || (await portfinder.getPortPromise());

  app.use(KoaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(
    KoaMount(
      url.parse(pri.projectConfig.publicPath).pathname,
      KoaStatic(distDir, {
        gzip: true,
        setHeaders: (res: any) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      })
    )
  );

  // const cssPath = path.join(distDir, 'main.css');
  // const hasCssOutput = fs.existsSync(cssPath);

  if (pri.projectConfig.useHttps) {
    await spinner('Create https server', async () => {
      return https.createServer(generateCertificate(), app.callback()).listen(freePort);
    });
  } else {
    await spinner('Create http server', async () => {
      return http.createServer(app.callback()).listen(freePort);
    });
  }

  if (pri.projectConfig.devUrl) {
    open(pri.projectConfig.devUrl);
  } else {
    open(
      ensureEndWithSlash(
        urlJoin(`${pri.projectConfig.useHttps ? 'https' : 'http'}://localhost:${freePort}`, pri.projectConfig.baseHref)
      )
    );
  }
};
