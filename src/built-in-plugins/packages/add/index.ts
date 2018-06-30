import * as colors from 'colors';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import { get } from 'lodash';
import * as path from 'path';
import * as ts from 'typescript';
import { exec } from '../../../utils/exec';
import { getPackageJson, runInTempFolderAndDestroyAfterFinished } from '../../../utils/file-operate';
import * as git from '../../../utils/git-operate';
import { globalState } from '../../../utils/global-state';
import { log, logError, spinner } from '../../../utils/log';
import { packagesPath } from '../config';
import { getExternalImportsFromProjectRoot } from '../utils';

export default async (gitUri: string) => {
  if (!gitUri) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to add:`,
        name: 'gitUri',
        type: 'input'
      }
    ]);

    gitUri = inquirerInfo.gitUri;
  }

  const extraPackages: Array<{ name: string; packageVersion: string }> = [];

  let packageName = '';

  await spinner(`add ${gitUri}`, async error => {
    await runInTempFolderAndDestroyAfterFinished(async tempFolderPath => {
      // Clone to local, so can read package.json
      try {
        await exec(`git clone ${gitUri} ${tempFolderPath}`);
      } catch {
        return error(`${gitUri} dosen't esixt.`);
      }

      const packageJson = await getPackageJson(tempFolderPath);
      packageName = get(packageJson, 'name', null);
      if (!packageName) {
        return error(`There is no property "name" in ${gitUri} package.json.`);
      }

      const projectPackageJson = await getPackageJson(globalState.projectRootPath);
      const importPaths = await getExternalImportsFromProjectRoot(tempFolderPath);
      const packageDeps = {
        ...get(packageJson, 'devDependencies', {}),
        ...get(packageJson, 'dependencies', {}),
        ...get(packageJson, 'peerDependencies', {})
      };

      const projectPackageDeps = {
        ...get(projectPackageJson, 'devDependencies', {}),
        ...get(projectPackageJson, 'dependencies', {}),
        ...get(projectPackageJson, 'peerDependencies', {})
      };

      importPaths.forEach(importPath => {
        const packageVersion = packageDeps[importPath] as string;
        const projectVersion = projectPackageDeps[importPath] as string;
        if (packageVersion !== projectVersion) {
          extraPackages.push({ name: importPath, packageVersion });
        }
      });

      await exec(
        [
          // Add local package to submodule
          `git submodule add --force --name ${packageName} ${tempFolderPath} ${path.join(packagesPath, packageName)}`,
          `git config --file=.gitmodules submodule.${
            packageName // Update it's config in .gitsubmodule
          }.url ${gitUri}`,
          `git submodule sync`
        ].join(';')
      );
    });
  });

  if (extraPackages.length > 0) {
    log(colors.yellow(`Lose packages in current project, and you need to judge what needs to be added:`));
    log(
      colors.blue(
        extraPackages
          .map(extraPackage => {
            return `${extraPackage.name}@${extraPackage.packageVersion}`;
          })
          .join(' ')
      )
    );
  }
};
