import * as path from 'path';
import * as portfinder from 'portfinder';
import * as webpack from 'webpack';
import * as urlJoin from 'url-join';
import { componentEntry, pri } from '../../../node';
import { logFatal } from '../../../utils/log';
import { plugin } from '../../../utils/plugins';
import { IOpts } from './interface';
import { runWebpack, bundleDlls } from '../../../utils/webpack';
import { runWebpackDevServer } from '../../../utils/webpack-dev-server';
import { dllOutPath, dllFileName, dllMainfestName, libraryStaticPath } from '../../command-dev/plugin/dll';
import { globalState } from '../../../utils/global-state';
import { WrapContent } from '../../../utils/webpack-plugin-wrap-content';

export const commandBundle = async (opts: IOpts = {}) => {
  if (pri.sourceConfig.type !== 'component') {
    logFatal("Only component support 'npm run bundle', try 'npm start'!");
  }

  if (!opts.dev) {
    await runWebpack({
      mode: 'production',
      outFileName: pri.sourceConfig.bundleFileName,
      entryPath: path.join(pri.sourceRoot, path.format(componentEntry)),
      publicPath: opts.publicPath,
      pipeConfig: async config => {
        let newConfig = { ...config };

        newConfig.output.libraryTarget = pri.sourceConfig.bundleLibraryTarget as any;

        newConfig = await plugin.bundleConfigPipes.reduce(async (nextConfig, fn) => {
          return fn(await nextConfig);
        }, Promise.resolve(config));

        return newConfig;
      },
    });
  } else {
    const freePort = await portfinder.getPortPromise({ port: pri.sourceConfig.devPort });

    await bundleDlls({ dllOutPath, dllFileName, dllMainfestName });

    runWebpackDevServer({
      mode: opts.mode ?? 'development',
      outFileName: pri.sourceConfig.bundleFileName,
      devServerPort: freePort,
      publicPath: `https://${pri.sourceConfig.host}:${freePort}`,
      jsOnly: true,
      entryPath: path.join(pri.sourceRoot, path.format(componentEntry)),
      pipeConfig: async config => {
        let newConfig = { ...config };

        newConfig.output.libraryTarget = pri.sourceConfig.bundleLibraryTarget as any;

        newConfig = await plugin.bundleConfigPipes.reduce(async (nextConfig, fn) => {
          return fn(await nextConfig);
        }, Promise.resolve(config));

        // bundle dev 模式支持 dll
        config.plugins.push(
          new webpack.DllReferencePlugin({
            context: '.',
            // eslint-disable-next-line import/no-dynamic-require,global-require
            manifest: require(path.join(dllOutPath, dllMainfestName)),
          }),
        );

        const dllHttpPath = urlJoin(
          `${globalState.sourceConfig.useHttps ? 'https' : 'http'}://${pri.sourceConfig.host}:${freePort}`,
          libraryStaticPath,
        );

        config.plugins.push(
          new WrapContent(
            `
            var dllScript = document.createElement("script");
            dllScript.src = "${dllHttpPath}";
            dllScript.onload = runEntry;
            document.body.appendChild(dllScript);
            function runEntry() {
          `,
            '}',
          ),
        );

        return newConfig;
      },
    });
  }
};

export const prepareBundle = async (opts: IOpts) => {
  await pri.project.ensureProjectFiles();

  if (!opts.dev && !opts.skipLint) {
    await pri.project.lint({
      lintAll: true,
      needFix: false,
      showBreakError: true,
    });
  }

  await pri.project.checkProjectFiles();
};
