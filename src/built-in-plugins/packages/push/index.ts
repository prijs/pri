import * as inquirer from 'inquirer';
import * as path from 'path';
import { pri } from '../../../node';
import { exec } from '../../../utils/exec';
import { addAllAndCommit, isWorkingTreeClean } from '../../../utils/git-operate';
import { globalState } from '../../../utils/global-state';
import { log, logError, spinner } from '../../../utils/log';
import { devDocs } from '../../command-docs';
import { packagesPath } from '../config';
import { getPackages } from '../utils';

export default async (packageName: string, message: string) => {
  const packages = await getPackages();

  if (!packageName) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to push.`,
        name: 'packageName',
        type: 'list',
        choices: packages.map(eachPackage => eachPackage.name)
      }
    ]);

    packageName = inquirerInfo.packageName;
  }

  const packageInfo = packages.find(eachPackage => eachPackage.name === packageName);

  if (!packageInfo) {
    logError(`${packageName} not exist`);
  }

  const packagePath = path.join(globalState.projectRootPath, packageInfo.path);

  if (await isWorkingTreeClean(packagePath)) {
    logError(`${packageName} has not modified.`);
  }

  if (!message) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Commit message:`,
        name: 'message',
        type: 'input'
      }
    ]);

    message = inquirerInfo.message;
  }

  // TODO:
  // change package.json deps

  await spinner(`push ${packageName}`, async () => {
    await addAllAndCommit(message || 'update.', packagePath);

    await exec(['git push'].join(';'), { cwd: packagePath });
  });
};
