import * as path from 'path';
import { componentEntry, pri } from '../../../node';
import { logFatal } from '../../../utils/log';
import { plugin } from '../../../utils/plugins';
import { runWebpack } from '../../../utils/webpack';
import { IOpts } from './interface';

export const commandBundle = async (opts: IOpts = {}) => {
  if (pri.sourceConfig.type !== 'component') {
    logFatal("Only component support 'npm run bundle', try 'npm start'!");
  }

  await pri.project.ensureProjectFiles();

  if (!opts.skipLint) {
    await pri.project.lint({
      lintAll: true,
      needFix: false,
      showBreakError: true
    });
  }

  await pri.project.checkProjectFiles();

  await runWebpack({
    mode: 'production',
    outFileName: pri.projectConfig.bundleFileName,
    entryPath: path.join(pri.sourceRoot, path.format(componentEntry)),
    pipeConfig: async config => {
      let newConfig = { ...config };

      newConfig.output.libraryTarget = 'umd';

      newConfig = await plugin.bundleConfigPipes.reduce(async (nextConfig, fn) => {
        return fn(await nextConfig);
      }, Promise.resolve(config));

      // external React & ReactDOM
      if (!config.externals) {
        newConfig.externals = {};
      }

      const externals = ['react', 'react-dom'];

      externals.forEach(eachExternal => {
        (newConfig.externals as any)[eachExternal] = {
          amd: eachExternal,
          commonjs: eachExternal,
          commonjs2: eachExternal
        };
      });

      return newConfig;
    }
  });
};
