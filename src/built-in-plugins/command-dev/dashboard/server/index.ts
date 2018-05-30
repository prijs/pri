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
import { createEntry } from '../../../../utils/create-entry';
import { generateCertificate } from '../../../../utils/generate-certificate';
import { log } from '../../../../utils/log';
import { md5 } from '../../../../utils/md5';
import { plugin } from '../../../../utils/plugins';
import { getConfig } from '../../../../utils/project-config';
import { IProjectConfig } from '../../../../utils/project-config-interface';
import * as projectManage from '../../../../utils/project-manager';

interface IOptions {
  serverPort: number;
  projectRootPath: string;
  env: 'local' | 'prod';
  projectConfig: IProjectConfig;
  analyseInfo: any;
}

export default (opts: IOptions) => {
  const app = new Koa();

  app.use(koaCors());

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }));

  app.use(koaMount('/static', koaStatic(path.join(opts.projectRootPath, '.temp'), { gzip: true })));

  const server = opts.projectConfig.useHttps
    ? https.createServer(generateCertificate(path.join(opts.projectRootPath, '.temp/dashboard-server')), app.callback())
    : http.createServer(app.callback());

  const io = socketIo(server);

  io.on('connection', async socket => {
    const projectStatus = { analyseInfo: opts.analyseInfo, projectConfig: opts.projectConfig };
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
      await projectManage.addPage(opts.projectRootPath, data);
    });

    socketListen('createLayout', async data => {
      await projectManage.createLayout(opts.projectRootPath);
    });

    socketListen('create404', async data => {
      await projectManage.create404(opts.projectRootPath);
    });

    socketListen('createConfig', async data => {
      await projectManage.createConfig(opts.projectRootPath);
    });

    // Load plugin's services
    plugin.devServices.socketListeners.forEach(socketListener => {
      socketListen(socketListener.name, socketListener.callback);
    });
  });

  // Watch project file's change
  chokidar
    .watch(path.join(opts.projectRootPath, '/**'), { ignored: /(^|[\/\\])\../, ignoreInitial: true })
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
      const relativePath = path.relative(opts.projectRootPath, filePath);
      const pathInfo = path.parse(filePath);

      try {
        io.emit('changeFile', { path: filePath, fileContent: fs.readFileSync(filePath).toString() });
      } catch (error) {
        //
      }

      if (relativePath.startsWith('config')) {
        await fresh();
      } else if (relativePath.startsWith('src') && pathInfo.ext === '.md') {
        await fresh();
      } else if (relativePath.startsWith('mocks') && pathInfo.ext === '.ts') {
        await fresh();
      }
    });

  async function fresh() {
    const projectStatus = await getProjectStatus();
    createEntry(opts.projectRootPath, opts.env, projectStatus.projectConfig);
    io.emit('freshProjectStatus', projectStatus);
  }

  async function getProjectStatus() {
    const projectConfig = getConfig(opts.projectRootPath, opts.env);

    const analyseInfo = await analyseProject(opts.projectRootPath, opts.env, projectConfig);

    return { projectConfig, analyseInfo };
  }

  // Socket
  server.listen(opts.serverPort);
};
