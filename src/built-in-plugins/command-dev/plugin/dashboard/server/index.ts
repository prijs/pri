import * as KoaCors from '@koa/cors';
import * as chokidar from 'chokidar';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as KoaCompress from 'koa-compress';
import * as KoaMount from 'koa-mount';
import * as KoaStatic from 'koa-static';
import * as path from 'path';
import * as socketIo from 'socket.io';
import * as zlib from 'zlib';
import { analyseProject } from '../../../../../utils/analyse-project';
import { CONFIG_FILE } from '../../../../../utils/constants';
import { createEntry } from '../../../../../utils/create-entry';
import { generateCertificate } from '../../../../../utils/generate-certificate';
import { freshProjectConfig, globalState } from '../../../../../utils/global-state';
import { plugin } from '../../../../../utils/plugins';
import * as projectManage from '../../../../../utils/project-manager';
import { tempPath } from '../../../../../utils/structor-config';

interface IOptions {
  serverPort: number;
  analyseInfo: any;
}

export default (opts: IOptions) => {
  const app = new Koa();

  app.use(KoaCors());

  app.use(KoaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(KoaMount('/static', KoaStatic(globalState.projectRootPath, tempPath.dir, { gzip: true })));

  const server = globalState.projectConfig.useHttps
    ? https.createServer(generateCertificate(), app.callback())
    : http.createServer(app.callback());

  const io = socketIo(server);

  io.on('connection', async socket => {
    function socketListen(name: string, fn: (data: any) => any) {
      socket.on(name, (data, callback) => {
        Promise.resolve(fn(data))
          .then(res => callback && callback({ success: true, data: res }))
          .catch(err => callback && callback({ success: false, data: err.toString() }));
      });
    }

    socketListen('addPage', async data => {
      await projectManage.addPage(data);
    });

    socketListen('createLayout', async () => {
      await projectManage.createLayout();
    });

    socketListen('create404', async () => {
      await projectManage.create404();
    });

    socketListen('createConfig', async () => {
      await projectManage.createConfig();
    });

    socketListen('getProjectStatus', async () => {
      await fresh();
    });

    // Load plugin's services
    plugin.devServices.socketListeners.forEach(socketListener => {
      socketListen(socketListener.name, socketListener.callback);
    });
  });

  // Watch project file's change
  chokidar
    .watch(path.join(globalState.sourceRoot, '/**'), { ignored: /(^|[/\\])\../, ignoreInitial: true })
    .on('add', async () => {
      await fresh();
    })
    .on('unlink', async () => {
      await fresh();
    })
    .on('unlinkDir', async () => {
      await fresh();
    })
    .on('change', async filePath => {
      // fresh when config change
      const relativePath = path.relative(globalState.sourceRoot, filePath);
      const pathInfo = path.parse(filePath);

      try {
        io.emit('changeFile', { path: filePath, fileContent: fs.readFileSync(filePath).toString() });
      } catch (error) {
        //
      }

      if (relativePath === CONFIG_FILE) {
        freshProjectConfig();
        await fresh();
      } else if (relativePath.startsWith('src') && pathInfo.ext === '.md') {
        await fresh();
      } else if (relativePath.startsWith('mocks') && pathInfo.ext === '.ts') {
        await fresh();
      }
    });

  async function fresh() {
    const projectStatus = await getProjectStatus();
    await createEntry();
    io.emit('freshProjectStatus', projectStatus);
  }

  async function getProjectStatus() {
    const analyseInfo = await analyseProject();

    return { projectConfig: globalState.projectConfig, analyseInfo };
  }

  // Socket
  server.listen(opts.serverPort);
};
