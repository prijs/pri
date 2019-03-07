import * as path from 'path';
import { componentEntry, pri } from '../../../node';
import { logFatal } from '../../../utils/log';
import { plugin } from '../../../utils/plugins';
import { runWebpack } from '../../../utils/webpack';
import { IOpts } from './interface';

export const commandBundle = async (opts: IOpts = {}) => {
  if (pri.projectPackageJson.pri.type !== 'component') {
    logFatal(`Only component support 'npm run bundle', try 'npm start'!`);
  }

  await pri.project.ensureProjectFiles();

  if (!opts.skipLint) {
    await pri.project.lint();
  }

  await pri.project.checkProjectFiles();

  await runWebpack({
    mode: 'production',
    outFileName: pri.projectConfig.bundleFileName,
    entryPath: path.join(pri.projectRootPath, path.format(componentEntry)),
    pipeConfig: async config => {
      config.output.libraryTarget = 'umd';

      config = await plugin.bundleConfigPipes.reduce(
        async (newConfig, fn) => fn(await newConfig),
        Promise.resolve(config)
      );

      // external React & ReactDOM
      if (!config.externals) {
        config.externals = {};
      }

      const externals = ['react', 'react-dom'];

      externals.forEach(eachExternal => {
        (config.externals as any)[eachExternal] = {
          amd: eachExternal,
          commonjs: eachExternal,
          commonjs2: eachExternal
        };
      });

      return config;
    }
  });
};
