import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as normalizePath from 'normalize-path';
import * as open from 'opn';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as webpack from 'webpack';
import { globalState } from '../../utils/global-state';
import { log } from '../../utils/log';
import { hasNodeModules, hasNodeModulesModified, hasPluginsModified } from '../../utils/project-helper';
import { compilerLogger } from '../../utils/webpack-compiler-log';
import getWebpackDllConfig from './webpack.dll.config';

export const dllFileName = 'main.dll.js';
export const dllMainfestName = 'mainfest.json';
export const dllOutPath = path.join(globalState.projectRootPath, '.temp/static/dlls');
export const libraryStaticPath = '/dlls/' + dllFileName;

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false,
  colors: true,
  children: false
};

interface IOptions {
  dllOutPath: string;
  dllFileName: string;
  dllMainfestName: string;
}

export const runDllWebpack = async (opts: IOptions): Promise<any> => {
  const compiler = webpack(getWebpackDllConfig(opts));
  compilerLogger(compiler as any);
  return runCompiler(compiler);
};

function runCompiler(compiler: webpack.Compiler) {
  return new Promise(resolve => {
    compiler.run((err, status) => {
      if (!err && !status.hasErrors()) {
        process.stdout.write(status.toString(stats) + '\n\n');

        resolve(status.toJson());
      } else {
        if (err && err.message) {
          throw Error(err.message);
        } else {
          throw Error(status.toString());
        }
      }
    });
  });
}

/**
 * Bundle dlls if node_modules changed, or dlls not exist.
 */
export async function bundleDlls() {
  if ((hasNodeModules() && hasNodeModulesModified()) || !fs.existsSync(path.join(dllOutPath, dllFileName))) {
    log(colors.blue('\nBundle dlls\n'));

    await runDllWebpack({ dllOutPath, dllFileName, dllMainfestName });
  }
}
