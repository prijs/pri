import { execSync } from 'child_process';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as path from 'path';
import * as semver from 'semver';
import { pri } from '../../../node';
import { exec } from '../../../utils/exec';
import { writePackageJson } from '../../../utils/file-operate';
import { addAllAndCommit } from '../../../utils/git-operate';
import { globalState } from '../../../utils/global-state';
import { log, logError, spinner } from '../../../utils/log';
import { devDocs } from '../../command-docs';
import { packagesPath } from '../config';
import push from '../push';
import update from '../update';
import { getPackages } from '../utils';

export default async (packageName: string, semverStr: semver.ReleaseType) => {
  if (semverStr && ['patch', 'minor', 'major'].indexOf(semverStr) === -1) {
    logError('semver must be patch | minor | major');
  }

  const packages = await getPackages();

  if (!packageName) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to publish.`,
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

  const projectType = _.get(packageInfo.packageJson, 'pri.type', null);
  if (projectType && projectType !== 'component') {
    // Is pri and only support component
    logError(`${packageName} is a pri ${projectType}, only support publish component!`);
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

  await update(packageName);

  // Change package version
  const newVersion = semver.inc(packageInfo.packageJson.version, semverStr);
  packageInfo.packageJson.version = newVersion;
  await writePackageJson(packageInfo.path, packageInfo.packageJson);

  await push(packageName, `Publish ${newVersion}`);

  // TODO:

  // Add tag

  // Run npm publish
  execSync(`npm publish --folder "${packagePath}"`, {
    stdio: 'inherit'
  });
};
