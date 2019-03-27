import * as fs from 'fs-extra';
import * as path from 'path';
import * as webpack from 'webpack';
import { globalState } from '../../../utils/global-state';
import { hasNodeModules, hasNodeModulesModified } from '../../../utils/project-helper';
import { tempPath } from '../../../utils/structor-config';
import getWebpackDllConfig from './webpack.dll.config';

export const dllFileName = 'main.dll.js';
export const dllMainfestName = 'mainfest.json';
export const dllOutPath = path.join(globalState.projectRootPath, `${tempPath.dir}/static/dlls`);
export const libraryStaticPath = `/dlls/${  dllFileName}`;

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
  return runCompiler(compiler);
};

function runCompiler(compiler: webpack.Compiler) {
  return new Promise(resolve => {
    compiler.run((err, status) => {
      if (!err && !status.hasErrors()) {
        process.stdout.write(`${status.toString(stats)  }\n\n`);

        resolve(status.toJson());
      } else if (err && err.message) {
          throw Error(err.message);
        } else {
          throw Error(status.toString());
        }
    });
  });
}

/**
 * Bundle dlls if node_modules changed, or dlls not exist.
 */
export async function bundleDlls() {
  if ((hasNodeModules() && hasNodeModulesModified()) || !fs.existsSync(path.join(dllOutPath, dllFileName))) {
    await runDllWebpack({ dllOutPath, dllFileName, dllMainfestName });
  }
}
