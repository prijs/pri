import * as fs from 'fs-extra';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as path from 'path';
import * as prettier from 'prettier';
import * as nodeExternals from 'webpack-node-externals';
import * as glob from 'glob';
import { pri, tempPath } from '../../../node';
import * as pipe from '../../../node/pipe';
import { analyseProject } from '../../../utils/analyse-project';
import { cleanDist } from '../../../utils/clean';
import { createEntry } from '../../../utils/create-entry';
import { exec } from '../../../utils/exec';
import { globalState } from '../../../utils/global-state';
import { logInfo, spinner } from '../../../utils/log';
import { findNearestNodemodulesFile } from '../../../utils/npm-finder';
import { plugin } from '../../../utils/plugins';
import { pluginEntry, assetsPath, srcPath, declarationPath } from '../../../utils/structor-config';
import { runWebpack } from '../../../utils/webpack';
import { getStaticHtmlPaths } from './generate-static-html';
import { IOpts } from './interface';
import { tsPlusBabel } from '../../../utils/ts-plus-babel';

export const buildProject = async (opts: IOpts = {}) => {
  await prepareBuild(opts);

  const result = await spinner('Analyse project', async () => {
    const analyseInfo = await analyseProject();
    const entryPath = await createEntry();
    return {
      analyseInfo,
      entryPath
    };
  });

  const staticHtmlPaths = getStaticHtmlPaths(result.analyseInfo);

  // Build project
  const stats = await runWebpack({
    mode: 'production',
    entryPath: result.entryPath,
    publicPath: opts.publicPath, // If unset, use config value.
    pipeConfig: async config => {
      staticHtmlPaths.forEach(staticHtmlPath => {
        config.plugins.push(
          new HtmlWebpackPlugin({
            title: pri.sourceConfig.title || globalState.projectRootPath.split(path.sep).pop(),
            filename: staticHtmlPath,
            template: path.join(__dirname, '../../../../template-project.ejs')
          })
        );
      });
      return config;
    }
  });

  // Write .temp/static/sw.js to [distDir]
  const tempSwPath = path.join(pri.projectRootPath, tempPath.dir, 'static/sw.js');
  const targetSwPath = path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'sw.js');

  if (fs.existsSync(tempSwPath)) {
    const tempSwContent = fs.readFileSync(tempSwPath).toString();
    const targetSwContent = await pipe.get('serviceWorkerAfterProdBuild', tempSwContent);
    fs.outputFileSync(
      targetSwPath,
      prettier.format(targetSwContent, {
        semi: true,
        singleQuote: true,
        parser: 'babylon'
      })
    );
  }

  await copyAssets();

  plugin.buildAfterProdBuild.forEach(afterProdBuild => {
    return afterProdBuild(stats);
  });
};

export const buildComponent = async (opts: IOpts = {}) => {
  await prepareBuild(opts);

  // FIXME:
  // Do not minimize in cloud build(def envirenment), because commnets will lead to
  // build error in cloud build.
  // const isCloudBuild = yargs.argv.cloud as boolean;

  // Build component
  // TODO: Wait for webpack5
  // ISSUE: https://github.com/webpack/webpack/issues/2933
  // DOC:   https://github.com/webpack/changelog-v5/blob/master/README.md#runtime-modules
  // const stats = await runWebpack({
  //   mode: 'production',
  //   target: 'node',
  //   libraryTarget: 'commonjs2',
  //   entryPath: path.join(pri.sourceRoot, path.format(componentEntry)),
  //   outFileName: pri.sourceConfig.outFileName,
  //   externals: [nodeExternals()],
  //   pipeConfig: async webpackConfig => {
  //     return {
  //       ...webpackConfig,
  //       optimization: {
  //         ...webpackConfig.optimization,
  //         minimize: isCloudBuild
  //       }
  //     };
  //   }
  // });

  // Add bin file to dist dir.
  // const binJsPath = path.join(pri.projectRootPath, pri.sourceConfig.distDir, 'bin.js');
  // fs.outputFileSync(
  //   binJsPath,
  //   `
  //   #!/usr/bin/env node

  //   require("./${path.parse(pri.sourceConfig.outFileName).name}")
  // `.trim()
  // );

  // TODO:
  await spinner(`build source files`, async () => {
    await tsPlusBabel(false);
  });

  await buildDeclaration();

  // TODO: add back after upgrade to webpack5
  // plugin.buildAfterProdBuild.forEach(afterProdBuild => {
  //   return afterProdBuild(stats);
  // });
};

export const buildPlugin = async (opts: IOpts = {}) => {
  await prepareBuild(opts);

  // Build component
  const stats = await runWebpack({
    mode: 'production',
    target: 'node',
    libraryTarget: 'commonjs2',
    entryPath: path.join(pri.sourceRoot, path.format(pluginEntry)),
    outFileName: pri.sourceConfig.outFileName,
    externals: [nodeExternals()]
  });

  plugin.buildAfterProdBuild.forEach(afterProdBuild => {
    return afterProdBuild(stats);
  });
};

// Copy assets dir to distDir
async function copyAssets() {
  const sourceAssetsPath = path.join(pri.sourceRoot, assetsPath.dir);

  if (!fs.existsSync(sourceAssetsPath)) {
    return;
  }

  const distAssetsPath = path.join(pri.projectRootPath, pri.sourceConfig.distDir, assetsPath.dir);
  if (fs.existsSync(distAssetsPath)) {
    logInfo('assets path exists in distDir, so skip /assets copy.');
  } else {
    await fs.copy(sourceAssetsPath, distAssetsPath);
  }
}

async function prepareBuild(opts: IOpts = {}) {
  await spinner('Clean project.', async () => {
    await cleanDist();

    // Clean .temp dir
    await exec(`${findNearestNodemodulesFile('.bin/rimraf')} ${pri.projectRootPath}/${tempPath.dir}`);

    await pri.project.ensureProjectFiles();

    if (!opts.skipLint) {
      await pri.project.lint({
        lintAll: true,
        needFix: false,
        showBreakError: true
      });
    }

    await pri.project.checkProjectFiles();
  });
}

async function buildDeclaration() {
  // Create d.ts
  await spinner(`create declaration`, async () => {
    try {
      await exec(
        `npx tsc --declaration --declarationDir ${path.join(
          pri.projectRootPath,
          `./${declarationPath.dir}`
        )} --emitDeclarationOnly >> /dev/null 2>&1`,
        {
          cwd: pri.projectRootPath
        }
      );
    } catch {
      //
    }
  });

  // If select packages, pick it's own declaration
  if (pri.selectedSourceType !== 'root') {
    fs.removeSync(path.join(pri.projectRootPath, declarationPath.dir, srcPath.dir));

    const declarationFiles = glob.sync(
      path.join(pri.projectRootPath, declarationPath.dir, 'packages', pri.selectedSourceType, srcPath.dir, '/**/*.d.ts')
    );

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(
        path.join(pri.projectRootPath, declarationPath.dir, 'packages', pri.selectedSourceType, srcPath.dir),
        eachFile
      );
      fs.copySync(eachFile, path.join(pri.projectRootPath, declarationPath.dir, targetPath));
    });

    fs.removeSync(path.join(pri.projectRootPath, declarationPath.dir, 'packages'));
  } else {
    // get declaration from src
    fs.removeSync(path.join(pri.projectRootPath, declarationPath.dir, 'packages'));

    const declarationFiles = glob.sync(path.join(pri.projectRootPath, declarationPath.dir, srcPath.dir, '**/*.d.ts'));

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(path.join(pri.projectRootPath, declarationPath.dir, srcPath.dir), eachFile);
      fs.copySync(eachFile, path.join(pri.projectRootPath, declarationPath.dir, targetPath));
    });

    fs.removeSync(path.join(pri.projectRootPath, declarationPath.dir, srcPath.dir));
  }
}
