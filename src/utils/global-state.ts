/**
 * Collect some information for current project.
 * Global state will be assigned in highest priority.
 */

import * as fs from 'fs-extra';
import { merge, omit } from 'lodash';
import * as path from 'path';
import * as yargs from 'yargs';
import * as inquirer from 'inquirer';
import * as pkg from '../../package.json';
import { CONFIG_FILE, PACKAGES_NAME } from './constants';
import { logFatal } from './log';
import { PackageJson, GlobalState, ProjectConfig } from './define';

const globalState = new GlobalState();

export async function initGlobalState(preSelectPackage: string) {
  globalState.priPackageJson = pkg;
  globalState.majorCommand = yargs.argv._.length === 0 ? 'dev' : yargs.argv._[0];
  globalState.isDevelopment = ['dev', 'docs'].some(operate => {
    return operate === globalState.majorCommand;
  });

  await freshGlobalState(preSelectPackage);
}

export async function freshGlobalState(preSelectPackage: string) {
  const cliCurrentPath = (yargs.argv.cwd as string) || process.cwd();
  globalState.projectRootPath = cliCurrentPath;

  await initPackages(cliCurrentPath, preSelectPackage);

  freshProjectConfig();

  // get project type from package.json
  const projectPackageJsonPath = path.join(globalState.projectRootPath, 'package.json');
  if (fs.existsSync(projectPackageJsonPath)) {
    const projectPackageJson = fs.readJsonSync(projectPackageJsonPath, { throws: false }) || {};

    globalState.projectPackageJson = projectPackageJson;
  } else {
    logFatal('No package.json, please run "npm init" first.');
  }
}

export function freshProjectConfig() {
  globalState.projectConfig = merge(new ProjectConfig(), getPriConfig(globalState.projectRootPath));
  globalState.packages = globalState.packages.map(eachPackage => {
    return {
      ...eachPackage,
      // Merge projectConfig and sourceConfig
      config: {
        // Omit type.
        ...omit(globalState.projectConfig, ['type']),
        ...getPriConfig(eachPackage.rootPath),
      },
    };
  });

  if (globalState.selectedSourceType === 'root') {
    globalState.sourceConfig = { ...globalState.projectConfig };
  } else {
    globalState.sourceConfig = globalState.packages.find(eachPackage => {
      return eachPackage.name === globalState.selectedSourceType;
    }).config;
  }
}

function getPriConfig(rootPath: string) {
  const configFilePath = path.join(rootPath, CONFIG_FILE);
  return fs.readJsonSync(configFilePath, { throws: false }) || {};
}

function collectPackages(packageRootPath: string, deep = 0) {
  // Only support two level packages
  if (deep >= 2) {
    return;
  }

  const currentPackagesPath = path.join(packageRootPath, PACKAGES_NAME);

  if (fs.existsSync(currentPackagesPath)) {
    fs.readdirSync(currentPackagesPath)
      .filter(folderName => {
        if (folderName === '.DS_Store') {
          return false;
        }

        return true;
      })
      .forEach(folderName => {
        const packagePath = path.join(packageRootPath, PACKAGES_NAME, folderName);
        const packageJson: PackageJson = fs.readJSONSync(path.join(packagePath, 'package.json'), { throws: false });

        const config = fs.readJsonSync(path.join(packagePath, CONFIG_FILE), { throws: false }) || {};

        const eachPackage = {
          name: folderName,
          rootPath: packagePath,
          packageJson,
          config,
        };

        globalState.packages.push(eachPackage);

        // find nested packages
        collectPackages(eachPackage.rootPath, deep + 1);
      });
  }
}

async function initPackages(projectRootPath: string, preSelectPackage: string) {
  collectPackages(projectRootPath);

  if (globalState.packages.length > 0) {
    if (!preSelectPackage) {
      const inquirerInfo = await inquirer.prompt([
        {
          message: 'Choose packages',
          name: 'packageName',
          type: 'list',
          choices: [
            { name: 'Root (Current Project)', value: 'root' },
            new inquirer.Separator(),
            ...globalState.packages.map(eachPackage => {
              return {
                name: `Package: ${eachPackage.name}`,
                value: eachPackage.name,
              };
            }),
          ],
        },
      ]);

      globalState.selectedSourceType = inquirerInfo.packageName;
    } else {
      if (
        preSelectPackage !== 'root' &&
        !globalState.packages.some(eachPackage => {
          return eachPackage.name === preSelectPackage;
        })
      ) {
        logFatal(`No package ${preSelectPackage}`);
      }

      globalState.selectedSourceType = preSelectPackage;
    }
  }

  switch (globalState.selectedSourceType) {
    case 'root':
      globalState.sourceRoot = projectRootPath;
      break;
    default:
      globalState.sourceRoot = globalState.packages.find(
        eachPackage => eachPackage.name === globalState.selectedSourceType,
      ).rootPath;
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
    ...globalState.packages.map(eachPackage => {
      return path.join(eachPackage.rootPath, relatePath);
    }),
  ];
}
