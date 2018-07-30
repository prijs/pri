import { execSync } from 'child_process';
import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as path from 'path';
import * as prettier from 'prettier';
import { componentEntry, pri, tempPath } from '../../node';
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

async function bundle(instance: typeof pri) {
  await instance.project.ensureProjectFiles();
  await instance.project.lint();
  await instance.project.checkProjectFiles();

  await runWebpack({
    mode: 'production',
    outFileName: instance.projectConfig.bundleFileName,
    entryPath: path.join(instance.projectRootPath, path.format(componentEntry)),
    pipeConfig: config => {
      config.output.libraryTarget = 'umd';
      return config;
    }
  });
}

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: 'bundle',
    description: text.commander.bundle.description,
    action: async () => {
      await bundle(instance);
    }
  });
};
