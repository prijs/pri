import * as colors from 'colors';
import * as fs from 'fs';
import * as normalizePath from 'normalize-path';
import * as open from 'opn';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as webpack from 'webpack';
import { compilerLogger } from '../../utils/webpack-compiler-log';
import getWebpackDllConfig from './webpack.dll.config';

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
  projectRootPath: string;
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
