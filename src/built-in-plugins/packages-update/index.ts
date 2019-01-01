import * as inquirer from 'inquirer';
import * as path from 'path';
import { pri } from '../../node';
import { exec } from '../../utils/exec';
import { addAllAndCommit, addAllAndCommitIfWorkingTreeNotClean, isWorkingTreeClean } from '../../utils/git-operate';
import { globalState } from '../../utils/global-state';
import { log, logError, spinner } from '../../utils/log';
import { ensurePackagesLinks, getPackages } from '../../utils/packages';

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['packages', 'update [packageName]'],
    description: `Update package.`,
    action: async options => {
      await ensurePackagesLinks(true);
      await packagesUpdate(options.packageName);
    }
  });
};

async function packagesUpdate(packageName: string) {
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
    logError(`${packageName} not exist`);
  }

  const packagePath = path.join(globalState.projectRootPath, packageInfo.path);

  await spinner(`update ${packageName}`, async () => {
    await addAllAndCommitIfWorkingTreeNotClean(`Prepare to update.`, packagePath);
    await exec(['git pull'].join(';'), { cwd: packagePath });
  });
}
