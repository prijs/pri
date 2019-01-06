import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { docsPath, pri } from '../../node';
import { freshGlobalState, globalState } from '../../utils/global-state';
import { logFatal } from '../../utils/log';
import { ensurePackagesLinks, getPackages } from '../../utils/packages';
import { devDocs } from '../command-docs';

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['packages', 'docs [packageName]'],
    description: 'Develop package docs.',
    action: async options => {
      await ensurePackagesLinks(true);
      await packagesDocs(options.packageName);
    }
  });
};

async function packagesDocs(packageName: string) {
  const packages = await getPackages();

  if (!packageName) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to run docs:`,
        name: 'packageName',
        type: 'list',
        choices: packages.map(eachPackage => eachPackage.name)
      }
    ]);

    packageName = inquirerInfo.packageName;
  }

  const packageInfo = packages.find(eachPackage => eachPackage.name === packageName);

  if (!packageInfo) {
    logFatal(`${packageName} not exist`);
  }

  // await devDocs(pri, docsPath.dir);
}
