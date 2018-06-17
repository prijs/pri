/**
 * Collect some information for current project.
 * Global state will be assigned in highest priority.
 */

import * as fs from 'fs-extra';
import { get, merge } from 'lodash';
import * as path from 'path';
import * as ts from 'typescript';
import * as yargs from 'yargs';
import { CONFIG_FILE } from './constants';
import { execTsByPath } from './functional';
import { ProjectConfig } from './project-config-interface';

const globalState: {
  projectRootPath: string;
  /**
   * majorCommand
   * for example: pri dev -d, the major command is "dev"
   */
  majorCommand: string;
  projectConfig: ProjectConfig;
  /**
   * Development enviroment.
   */
  isDevelopment: boolean;
  /**
   * Project type
   */
  projectType: 'project' | 'component' | 'plugin' | null;
} = {} as any;

globalState.projectRootPath = process.cwd();
globalState.majorCommand = yargs.argv._.length === 0 ? 'dev' : yargs.argv._[0];
globalState.isDevelopment = ['dev', 'docs'].some(operate => operate === globalState.majorCommand);
globalState.projectConfig = getProjectConfig(globalState.isDevelopment);

// get pri type from package.json
const projectPackageJsonPath = path.join(globalState.projectRootPath, 'package.json');
if (fs.existsSync(projectPackageJsonPath)) {
  const projectPackageJson = fs.readJsonSync(projectPackageJsonPath, { throws: false }) || {};
  globalState.projectType = get(projectPackageJson, 'pri.type', null);
}

function getProjectConfig(isDevelopment: boolean) {
  const configFilePath = path.join(globalState.projectRootPath, CONFIG_FILE);
  let userProjectConfig: ProjectConfig | ((isDevelopment: boolean) => ProjectConfig) =
    execTsByPath(configFilePath) || {};

  if (typeof userProjectConfig === 'function') {
    userProjectConfig = userProjectConfig(isDevelopment);
  }

  return merge(new ProjectConfig(), userProjectConfig);
}

export { globalState };
