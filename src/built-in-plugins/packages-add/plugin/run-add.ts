import * as inquirer from 'inquirer';
import { get } from 'lodash';
import * as path from 'path';
import { exec } from '../../../utils/exec';
import { getPackageJson, runInTempFolderAndDestroyAfterFinished } from '../../../utils/file-operate';
import { globalState } from '../../../utils/global-state';
import { logInfo, logWarn, spinner } from '../../../utils/log';
import { getExternalImportsFromProjectRoot, packagesPath } from '../../../utils/packages';

export async function addPackages(gitUri: string) {
  if (!gitUri) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Input packages to add:`,
        name: 'gitUri',
        type: 'input'
      }
    ]);

    gitUri = inquirerInfo.gitUri;
  }

  const extraPackages: { name: string; packageVersion: string }[] = [];

  let packageName = '';

  await spinner(`add ${gitUri}`, async error => {
    await runInTempFolderAndDestroyAfterFinished(async tempFolderPath => {
      // Clone to local, so can read package.json
      try {
        await exec(`git clone ${gitUri} ${tempFolderPath}`);
      } catch (err) {
        return error(err);
      }

      const packageJson = await getPackageJson(tempFolderPath);
      packageName = get(packageJson, 'name', null);
      if (!packageName) {
        return error(`There is no property "name" in ${gitUri} package.json.`);
      }

      if (get(packageJson, 'pri.type') !== 'component') {
        return error(`You can only using pri packages with "pri component" type.`);
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

        if (!packageVersion) {
          // Hasn't packageVersion means it's a sub dependence, so could be ignored.
          return;
        }

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
    logWarn(`Lose packages in current project, and you need to judge what needs to be added:`);
    logInfo(
      extraPackages
        .map(extraPackage => {
          return `${extraPackage.name}@${extraPackage.packageVersion}`;
        })
        .join(' ')
    );
  }
}
