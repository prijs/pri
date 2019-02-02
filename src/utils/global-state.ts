/**
 * Collect some information for current project.
 * Global state will be assigned in highest priority.
 */

import * as fs from 'fs-extra';
import { merge } from 'lodash';
import * as path from 'path';
import * as yargs from 'yargs';
import * as pkg from '../../package.json';
import { CONFIG_FILE } from './constants';
import { GlobalState } from './global-state-class';
import { ProjectConfig } from './project-config-interface';

const globalState = new GlobalState();

globalState.priPackageJson = pkg;
globalState.majorCommand = yargs.argv._.length === 0 ? 'dev' : yargs.argv._[0];
globalState.isDevelopment = ['dev', 'docs'].some(operate => operate === globalState.majorCommand);

freshGlobalState((yargs.argv.cwd as string) || process.cwd());

export function freshGlobalState(projectRootPath: string) {
  globalState.projectRootPath = projectRootPath;

  freshProjectConfig();

  // get project type from package.json
  const projectPackageJsonPath = path.join(globalState.projectRootPath, 'package.json');
  if (fs.existsSync(projectPackageJsonPath)) {
    const projectPackageJson = fs.readJsonSync(projectPackageJsonPath, { throws: false }) || {};

    if (!projectPackageJson.pri) {
      projectPackageJson.pri = {};
    }

    globalState.projectPackageJson = projectPackageJson;
  }
}

export function freshProjectConfig() {
  globalState.projectConfig = getProjectConfig(globalState.isDevelopment);
}

function getProjectConfig(isDevelopment: boolean) {
  const configFilePath = path.join(globalState.projectRootPath, CONFIG_FILE);
  const userProjectConfig: ProjectConfig = fs.readJsonSync(configFilePath, { throws: false }) || {};

  return merge(new ProjectConfig(), userProjectConfig);
}

export { globalState };
