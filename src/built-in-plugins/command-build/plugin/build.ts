import * as fs from 'fs-extra';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as path from 'path';
import * as prettier from 'prettier';
import * as nodeExternals from 'webpack-node-externals';
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
import { componentEntry, pluginEntry } from '../../../utils/structor-config';
import { runWebpack } from '../../../utils/webpack';
import { getStaticHtmlPaths } from './generate-static-html';

export const buildProject = async (
  opts: {
    publicPath?: string;
  } = {}
) => {
  await prepareBuild();

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
            title: pri.projectConfig.title || globalState.projectRootPath.split(path.sep).pop(),
            filename: staticHtmlPath,
            template: path.join(__dirname, '../../../../template-project.ejs')
          })
        );
      });
      return config;
    }
  });

  // Write .temp/static/sw.js to [distDir]
  const tempSwPath = path.join(globalState.projectRootPath, tempPath.dir, 'static/sw.js');
  const targetSwPath = path.join(globalState.projectRootPath, pri.projectConfig.distDir, 'sw.js');

  if (fs.existsSync(tempSwPath)) {
    const tempSwContent = fs.readFileSync(tempSwPath).toString();
    const targetSwContent = await pipe.get('serviceWorkerAfterProdBuild', tempSwContent);
    fs.outputFileSync(
      targetSwPath,
      prettier.format(targetSwContent, {
        semi: true,
        singleQuote: true,
        parser: 'babylon'
        // parser: 'babel'
      })
    );
  }

  await copyAssets();

  await buildDeclaration();

  plugin.buildAfterProdBuild.forEach(afterProdBuild => afterProdBuild(stats));
};

export const buildComponent = async () => {
  await prepareBuild();

  // Build component
  const stats = await runWebpack({
    mode: 'production',
    target: 'node',
    libraryTarget: 'commonjs2',
    entryPath: path.join(pri.projectRootPath, path.format(componentEntry)),
    outFileName: pri.projectConfig.outFileName,
    externals: [nodeExternals()]
  });

  // Add bin file to dist dir.
  const binJsPath = path.join(pri.projectRootPath, pri.projectConfig.distDir, 'bin.js');
  fs.writeFileSync(
    binJsPath,
    `
    #!/usr/bin/env node

    require("./${path.parse(pri.projectConfig.outFileName).name}")
  `.trim()
  );

  await buildDeclaration();

  plugin.buildAfterProdBuild.forEach(afterProdBuild => afterProdBuild(stats));
};

export const buildPlugin = async () => {
  await prepareBuild();

  // Build component
  const stats = await runWebpack({
    mode: 'production',
    target: 'node',
    libraryTarget: 'commonjs2',
    entryPath: path.join(pri.projectRootPath, path.format(pluginEntry)),
    outFileName: pri.projectConfig.outFileName,
    externals: [nodeExternals()]
  });

  plugin.buildAfterProdBuild.forEach(afterProdBuild => afterProdBuild(stats));
};

// Copy assets dir to distDir
async function copyAssets() {
  const sourceAssetsPath = path.join(globalState.projectRootPath, 'assets');

  if (!fs.existsSync(sourceAssetsPath)) {
    return;
  }

  const distAssetsPath = path.join(globalState.projectRootPath, pri.projectConfig.distDir, 'assets');
  if (fs.existsSync(distAssetsPath)) {
    logInfo(`assets path exists in distDir, so skip /assets copy.`);
  } else {
    await fs.copy(sourceAssetsPath, distAssetsPath);
  }
}

async function prepareBuild() {
  await spinner('Clean project.', async () => {
    await cleanDist();

    // Clean .temp dir
    await exec(`${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(globalState.projectRootPath, tempPath.dir)}`);

    await pri.project.ensureProjectFiles();
    await pri.project.lint();
    await pri.project.checkProjectFiles();
  });
}

async function buildDeclaration() {
  // Create d.ts if ignoreSourceInNpm
  if (pri.projectConfig.ignoreSourceInNpm) {
    await exec(`npx tsc --declaration --declarationDir ./declaration`, { cwd: pri.projectRootPath });
  }
}
