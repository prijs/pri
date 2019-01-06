import { execSync } from 'child_process';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as path from 'path';
import * as semver from 'semver';
import { pri } from '../../node';
import { writePackageJson } from '../../utils/file-operate';
import { globalState } from '../../utils/global-state';
import { logFatal, logText, spinner } from '../../utils/log';
import { ensurePackagesLinks, getPackages } from '../../utils/packages';

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['packages', 'publish [packageName] [semver]'],
    description: `Publish package.`,
    action: async options => {
      await ensurePackagesLinks(true);
      await packagesPublish(options.packageName, options.semver);
    }
  });
};

async function packagesPublish(packageName: string, semverStr: semver.ReleaseType) {
  if (semverStr && ['patch', 'minor', 'major'].indexOf(semverStr) === -1) {
    logFatal('semver must be patch | minor | major');
  }

  const packages = await getPackages();

  if (!packageName) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to publish:`,
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

  const projectType = _.get(packageInfo.packageJson, 'pri.type', null);
  if (projectType && projectType !== 'component') {
    // Is pri and only support component
    logFatal(`${packageName} is a pri ${projectType}, only support publish component!`);
  }

  if (!semverStr) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: 'Please choose which version to publish.',
        name: 'semverStr',
        type: 'list',
        choices: [
          {
            name: 'patch(Bug fix.)',
            value: 'patch'
          },
          {
            name: 'minor(New function.)',
            value: 'minor'
          },
          {
            name: 'major(Major update or break changes.)',
            value: 'major'
          }
        ]
      }
    ]);
    semverStr = inquirerInfo.semverStr;
  }

  // await update(packageName);

  // // Change package version
  // const newVersion = semver.inc(packageInfo.packageJson.version, semverStr);
  // packageInfo.packageJson.version = newVersion;
  // await writePackageJson(packageInfo.path, packageInfo.packageJson);

  // await push(packageName, `Publish ${newVersion}`);

  // // Build TODO:

  // // Run npm publish
  // if (_.get(packageInfo.packageJson, 'publishConfig.registry') === 'http://registry.npm.alibaba-inc.com') {
  //   execSync(`tnpm publish`, {
  //     stdio: 'inherit',
  //     cwd: packagePath
  //   });
  // } else {
  //   execSync(`npm publish`, {
  //     stdio: 'inherit',
  //     cwd: packagePath
  //   });
  // }
}
