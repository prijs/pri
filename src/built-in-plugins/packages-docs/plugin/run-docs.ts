import * as inquirer from 'inquirer';
import { logFatal } from '../../../utils/log';
import { getPackages } from '../../../utils/packages';

export async function packagesDocs(packageName: string) {
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
