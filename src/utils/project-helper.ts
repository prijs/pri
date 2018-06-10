import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as walk from 'walk';
import { globalState } from './global-state';
import { md5 } from './md5';
import { loadedPlugins } from './plugins';
import * as projectState from './project-state';
import { tempPath } from './structor-config';

export const hasNodeModules = () => {
  return fs.existsSync(path.join(globalState.projectRootPath, 'node_modules'));
};

export const hasNodeModulesModified = () => {
  const key = 'node_modules-modified-time';
  const nextModifiedTime = fs.statSync(path.join(globalState.projectRootPath, 'node_modules')).mtime.toString();

  return hasChanged(key, nextModifiedTime);
};

export const hasPluginsModified = async () => {
  const key = 'plugins-modified-time-hash';

  const pluginsHash: Array<{
    name: string;
    hash: string;
  }> = [];
  for (const loadedPlugin of Array.from(loadedPlugins)) {
    try {
      const packageJsonPath = require.resolve(path.join(loadedPlugin.pathOrModuleName, 'package.json'), {
        paths: [__dirname, globalState.projectRootPath]
      });
      const pathInfo = path.parse(packageJsonPath);
      const dirHash = await getFolderHash(pathInfo.dir);
      pluginsHash.push({ name: loadedPlugin.pathOrModuleName, hash: md5(dirHash) });
    } catch (error) {
      // no package.json
    }
  }

  _.sortBy(pluginsHash, 'name');

  const nextHash = md5(
    pluginsHash.reduce((hash, pluginHash) => {
      return hash + pluginHash.name + pluginHash.hash;
    }, '')
  );

  return hasChanged(key, nextHash);
};

function getFolderHash(dir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const walker = walk.walk(dir, { filters: [path.join(dir, 'node_modules'), path.join(dir, '.git')] });

    let hash = '';

    walker.on('directories', (root: string, dirStatsArray: any[], next: () => void) => {
      dirStatsArray.forEach(dirStats => {
        hash += dirStats.mtime;
      });
      next();
    });

    walker.on('file', (root: string, fileStats: any, next: () => void) => {
      hash += fileStats.mtime;
      next();
    });

    walker.on('errors', (root: string, nodeStatsArray: any, next: () => void) => {
      next();
    });

    walker.on('end', () => {
      resolve(hash);
    });
  });
}

function hasChanged(key: string, nextValue: string) {
  const previewValue = projectState.get(key);
  if (!previewValue) {
    projectState.set(key, nextValue);
    return true;
  } else {
    projectState.set(key, nextValue);
    if (previewValue !== nextValue) {
      return true;
    } else {
      return false;
    }
  }
}
