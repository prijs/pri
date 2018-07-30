import * as koaCors from '@koa/cors';
import * as chokidar from 'chokidar';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as koaCompress from 'koa-compress';
import * as koaMount from 'koa-mount';
import * as koaStatic from 'koa-static';
import * as _ from 'lodash';
import * as path from 'path';
import * as socketIo from 'socket.io';
import * as zlib from 'zlib';
import { analyseProject } from '../../../../utils/analyse-project';
import { CONFIG_FILE } from '../../../../utils/constants';
import { createEntry } from '../../../../utils/create-entry';
import { generateCertificate } from '../../../../utils/generate-certificate';
import { freshProjectConfig, globalState } from '../../../../utils/global-state';
import { log } from '../../../../utils/log';
import { md5 } from '../../../../utils/md5';
import { plugin } from '../../../../utils/plugins';
import { ProjectConfig } from '../../../../utils/project-config-interface';
import * as projectManage from '../../../../utils/project-manager';

interface IOptions {
  serverPort: number;
  analyseInfo: any;
}

export default (opts: IOptions) => {
  const app = new Koa();

  app.use(koaCors());

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(koaMount('/static', koaStatic(path.join(globalState.projectRootPath, '.temp'), { gzip: true })));

  const server = globalState.projectConfig.useHttps
    ? https.createServer(generateCertificate(), app.callback())
    : http.createServer(app.callback());

  const io = socketIo(server);

  io.on('connection', async socket => {
    const projectStatus = { analyseInfo: opts.analyseInfo, projectConfig: globalState.projectConfig };
    socket.emit('freshProjectStatus', projectStatus);
    socket.emit('initProjectStatus', projectStatus);

    function socketListen(name: string, fn: (data: any) => any) {
      socket.on(name, (data, callback) => {
        Promise.resolve(fn(data))
          .then(res => callback({ success: true, data: res }))
          .catch(err => callback({ success: false, data: err.toString() }));
      });
    }

    socketListen('addPage', async data => {
      await projectManage.addPage(data);
    });

    socketListen('createLayout', async data => {
      await projectManage.createLayout();
    });

    socketListen('create404', async data => {
      await projectManage.create404();
    });

    socketListen('createConfig', async data => {
      await projectManage.createConfig();
    });

    // Load plugin's services
    plugin.devServices.socketListeners.forEach(socketListener => {
      socketListen(socketListener.name, socketListener.callback);
    });
  });

  // Watch project file's change
  chokidar
    .watch(path.join(globalState.projectRootPath, '/**'), { ignored: /(^|[\/\\])\../, ignoreInitial: true })
    .on('add', async filePath => {
      await fresh();
    })
    .on('unlink', async filePath => {
      await fresh();
    })
    .on('unlinkDir', async filePath => {
      await fresh();
    })
    .on('change', async filePath => {
      // fresh when config change
      const relativePath = path.relative(globalState.projectRootPath, filePath);
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
    createEntry();
    io.emit('freshProjectStatus', projectStatus);
  }

  async function getProjectStatus() {
    const analyseInfo = await analyseProject();

    return { projectConfig: globalState.projectConfig, analyseInfo };
  }

  // Socket
  server.listen(opts.serverPort);
};
