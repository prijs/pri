import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { pri } from '../../../node';
import { globalState } from '../../../utils/global-state';
import { devDocs } from '../../command-docs';
import { packagesPath } from '../config';
import { getPackages } from '../utils';

export default async (packageName: string) => {
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

  await devDocs(pri, path.join(packagesPath, packageName, 'docs'));
};
