/**
 * Collect some information for current project.
 * Global state will be assigned in highest priority.
 */

import * as fs from 'fs-extra';
import { merge } from 'lodash';
import * as path from 'path';
import * as yargs from 'yargs';
import * as inquirer from 'inquirer';
import * as pkg from '../../package.json';
import { CONFIG_FILE, PACKAGES_NAME } from './constants';
import { logFatal } from './log';
import { PackageJson, GlobalState, ProjectConfig } from './define';

const globalState = new GlobalState();

export async function initGlobalState() {
  globalState.priPackageJson = pkg;
  globalState.majorCommand = yargs.argv._.length === 0 ? 'dev' : yargs.argv._[0];
  globalState.isDevelopment = ['dev', 'docs'].some(operate => operate === globalState.majorCommand);

  await freshGlobalState();
}

async function freshGlobalState() {
  const cliCurrentPath = (yargs.argv.cwd as string) || process.cwd();
  globalState.projectRootPath = cliCurrentPath;

  await initPackages(cliCurrentPath);

  freshProjectConfig();

  // get project type from package.json
  const projectPackageJsonPath = path.join(globalState.projectRootPath, 'package.json');
  if (fs.existsSync(projectPackageJsonPath)) {
    const projectPackageJson = fs.readJsonSync(projectPackageJsonPath, { throws: false }) || {};

    globalState.projectPackageJson = projectPackageJson;
  } else {
    logFatal(`No package.json, please run "npm init" first.`);
  }
}

export function freshProjectConfig() {
  globalState.projectConfig = freshConfig(globalState.projectRootPath);
  globalState.packages.forEach(eachPackage => {
    eachPackage.config = freshConfig(eachPackage.rootPath);
  });

  if (globalState.selectedSourceType === 'Root') {
    globalState.sourceConfig = { ...globalState.projectConfig };
  } else {
    globalState.sourceConfig = globalState.packages.find(
      eachPackage => eachPackage.name === globalState.selectedSourceType
    ).config;
  }
}

function freshConfig(rootPath: string) {
  const configFilePath = path.join(rootPath, CONFIG_FILE);
  const userProjectConfig: ProjectConfig = fs.readJsonSync(configFilePath, { throws: false }) || {};

  return merge(new ProjectConfig(), userProjectConfig);
}

async function initPackages(cliCurrentPath: string) {
  const currentPackagesPath = path.join(cliCurrentPath, PACKAGES_NAME);

  if (fs.existsSync(currentPackagesPath)) {
    globalState.packages = fs.readdirSync(currentPackagesPath).map(folderName => {
      const packagePath = path.join(cliCurrentPath, PACKAGES_NAME, folderName);
      const packageJson: PackageJson = fs.readJSONSync(path.join(packagePath, 'package.json'), { throws: false });

      const config = fs.readJsonSync(path.join(packagePath, CONFIG_FILE), { throws: false }) || {};

      return {
        name: folderName,
        rootPath: packagePath,
        packageJson,
        config
      };
    });
  }

  if (globalState.packages.length > 0) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages`,
        name: 'packageName',
        type: 'list',
        choices: ['Root', ...globalState.packages.map(eachPackage => eachPackage.name)]
      }
    ]);

    globalState.selectedSourceType = inquirerInfo.packageName;
  }

  switch (globalState.selectedSourceType) {
    case 'Root':
      globalState.sourceRoot = cliCurrentPath;
      break;
    default:
      globalState.sourceRoot = path.join(cliCurrentPath, PACKAGES_NAME, globalState.selectedSourceType);
  }
}

export { globalState };

/**
 * Transfer relative path to absolute paths, include root and pacakges.
 */
export function transferToAllAbsolutePaths(relatePath: string) {
  if (path.isAbsolute(relatePath)) {
    throw Error(`${relatePath} is not a relative path.`);
  }

  return [
    path.join(globalState.projectRootPath, relatePath),
    ...globalState.packages.map(eachPackage => path.join(eachPackage.rootPath, relatePath))
  ];
}
