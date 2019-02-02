import * as inquirer from 'inquirer';
import * as path from 'path';
import { exec } from '../../../utils/exec';
import { addAllAndCommitIfWorkingTreeNotClean } from '../../../utils/git-operate';
import { globalState } from '../../../utils/global-state';
import { logFatal, spinner } from '../../../utils/log';
import { getPackages } from '../../../utils/packages';

export async function packagesUpdate(packageName: string) {
  const packages = await getPackages();

  if (!packageName) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to update:`,
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

  const packagePath = path.join(globalState.projectRootPath, packageInfo.path);

  await spinner(`update ${packageName}`, async () => {
    await addAllAndCommitIfWorkingTreeNotClean(`Prepare to update.`, packagePath);
    await exec(['git pull'].join(';'), { cwd: packagePath });
  });
}
