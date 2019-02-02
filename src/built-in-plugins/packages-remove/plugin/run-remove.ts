import * as inquirer from 'inquirer';
import * as path from 'path';
import { exec } from '../../../utils/exec';
import { logFatal, spinner } from '../../../utils/log';
import { getPackages, packagesPath } from '../../../utils/packages';

export async function packagesRemove(packageName: string) {
  const packages = await getPackages();

  if (!packageName) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to remove:`,
        name: 'packageName',
        type: 'list',
        choices: packages.map(eachPackage => eachPackage.name)
      }
    ]);

    packageName = inquirerInfo.packageName;
  }

  if (!packages.some(eachPackage => eachPackage.name === packageName)) {
    logFatal(`Package ${packageName} not exist.`);
  }

  await spinner(`remove ${packageName}`, async error => {
    await exec(
      [
        `git submodule deinit -f -- ${path.join(packagesPath, packageName)}`,
        `git config -f .gitmodules --remove-section submodule.${packageName}`,
        `git add .gitmodules`,
        `rm -rf .git/modules/${packageName}`,
        `git rm -f ${path.join(packagesPath, packageName)}`
      ].join(';')
    );

    if (packages.length === 1) {
      await exec(`rm -rf ${packagesPath}`);
    }
  });
}
