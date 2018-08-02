import { execSync } from 'child_process';
import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as path from 'path';
import * as prettier from 'prettier';
import { pri, tempPath } from '../../node';
import * as pipe from '../../node/pipe';
import { analyseProject } from '../../utils/analyse-project';
import { createEntry } from '../../utils/create-entry';
import { exec } from '../../utils/exec';
import { globalState } from '../../utils/global-state';
import { log, spinner } from '../../utils/log';
import { findNearestNodemodulesFile } from '../../utils/npm-finder';
import { plugin } from '../../utils/plugins';
import { ProjectConfig } from '../../utils/project-config-interface';
import text from '../../utils/text';
import { tsPlusBabel } from '../../utils/ts-plus-babel';
import { runWebpack } from '../../utils/webpack';
import { getStaticHtmlPaths } from './generate-static-html';

async function prepareBuild(instance: typeof pri) {
  await spinner('Clean project.', async () => {
    // Clean dist dir
    await exec(
      `${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(
        globalState.projectRootPath,
        instance.projectConfig.distDir
      )}`
    );
    await exec(
      `${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(
        globalState.projectRootPath,
        globalState.projectConfig.distDir
      )}`
    );

    // Clean .temp dir
    await exec(`${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(globalState.projectRootPath, '.temp')}`);

    await instance.project.ensureProjectFiles();
    await instance.project.lint();
    await instance.project.checkProjectFiles();
  });
}

export const buildProject = async (
  instance: typeof pri,
  opts: {
    publicPath?: string;
  } = {}
) => {
  await prepareBuild(instance);

  const result = await spinner('Analyse project', async () => {
    const analyseInfo = await analyseProject();
    const entryPath = createEntry();
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
    pipeConfig: config => {
      staticHtmlPaths.forEach(staticHtmlPath => {
        config.plugins.push(
          new HtmlWebpackPlugin({
            title: instance.projectConfig.title,
            filename: staticHtmlPath,
            template: path.join(__dirname, '../../../template-project.ejs')
          })
        );
      });
      return config;
    }
  });

  // Write .temp/static/sw.js
  const tempSwPath = path.join(globalState.projectRootPath, tempPath.dir, 'static/sw.js');
  const targetSwPath = path.join(globalState.projectRootPath, instance.projectConfig.distDir, 'sw.js');

  plugin.buildAfterProdBuild.forEach(afterProdBuild => afterProdBuild(stats));

  if (fs.existsSync(tempSwPath)) {
    const tempSwContent = fs.readFileSync(tempSwPath).toString();
    const targetSwContent = pipe.get('serviceWorkerAfterProdBuild', tempSwContent);
    fs.outputFileSync(
      targetSwPath,
      prettier.format(targetSwContent, {
        semi: true,
        singleQuote: true,
        parser: 'babylon'
      })
    );
  }
};

export const buildComponent = async (
  instance: typeof pri,
  opts: {
    publicPath?: string;
  } = {}
) => {
  await prepareBuild(instance);

  await spinner('Building...', async () => {
    await tsPlusBabel(instance.projectConfig.distDir);
  });
};

export default async (instance: typeof pri) => {
  instance.project.onCreateEntry((analyseInfo, entry) => {
    if (!instance.isDevelopment) {
      entry.pipeEnvironmentBody(envText => {
        return `
            ${envText}
            priStore.globalState = ${JSON.stringify(globalState)}
          `;
      });
    }
  });

  instance.commands.registerCommand({
    name: 'build',
    options: [['-c, --cloud', 'Cloud build tag'], ['-p, --publicPath <pathname>', 'rewrite publicPath']],
    description: text.commander.build.description,
    action: async (options: any) => {
      if (instance.projectType === 'component') {
        await buildComponent(instance, options);
      } else {
        await buildProject(instance, options);
      }

      // For async register commander, process will be exit automatic.
      process.exit(0);
    }
  });
};
