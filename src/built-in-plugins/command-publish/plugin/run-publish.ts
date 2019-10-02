import * as fs from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import { PublishOption } from './interface';
import { exec } from '../../../utils/exec';
import { pri, tempPath, declarationPath } from '../../../node';
import { buildComponent } from '../../command-build/plugin/build';
import { commandBundle } from '../../command-bundle/plugin/command-bundle';
import { isWorkingTreeClean, getCurrentBranchName } from '../../../utils/git-operate';
import { logInfo, spinner } from '../../../utils/log';
import { getMonoAndNpmDepsOnce, DepMap } from '../../../utils/packages';
import { PackageInfo } from '../../../utils/define';
import {
  buildDeclaration,
  generateVersion,
  addTagAndPush,
  moveSourceFilesToTempFolderAndPublish,
  upgradePackageVersionAndPush,
  generateTag,
  prePareParamsBeforePublish,
  checkEnvBeforePublish,
} from './utils.js';

export const publish = async (options: PublishOption) => {
  const currentBranchName = await getCurrentBranchName();
  const isDevelopBranch = ['master', 'develop'].includes(currentBranchName);

  switch (pri.sourceConfig.type) {
    case 'component':
    case 'plugin': {
      if (!options.skipNpm) {
        await pri.project.ensureProjectFiles();
        await pri.project.checkProjectFiles();

        const currentSelectedSourceType = pri.selectedSourceType;

        if (!options.skipLint) {
          await pri.project.lint({
            lintAll: true,
            needFix: false,
            showBreakError: true,
          });
        }

        const { depMonoPackages, depMap } = await getMonoAndNpmDepsOnce();

        if (depMonoPackages.length > 0) {
          const installAllPrompt = await inquirer.prompt([
            {
              message: `${pri.selectedSourceType} depends on monorepo ${depMonoPackages
                .map(eachPackage => `"${eachPackage.name}"`)
                .join(', ')} \n Do you want to publish all packages?`,
              name: 'publishAllPackages',
              type: 'confirm',
            },
          ]);

          await buildDeclaration();

          if (installAllPrompt.publishAllPackages) {
            // async publish
            await publishPackageAndItsMonoPackage(
              currentSelectedSourceType,
              options,
              depMap,
              depMonoPackages,
              isDevelopBranch,
              currentBranchName,
            );
          } else {
            await publishByPackageName(currentSelectedSourceType, options, depMap, isDevelopBranch, currentBranchName);
          }
        } else {
          await buildDeclaration();
          await publishByPackageName(currentSelectedSourceType, options, depMap, isDevelopBranch, currentBranchName);
        }

        await fs.remove(path.join(pri.projectRootPath, tempPath.dir, declarationPath.dir));

        await exec(`git push origin ${currentBranchName}`);
      }
      break;
    }
    case 'project':
    default:
    // Not sure what to do, so keep empty.
  }
};

async function publishByPackageName(
  sourceType: string,
  options: PublishOption,
  depMap: DepMap,
  isDevelopBranch: boolean,
  currentBranchName: string,
) {
  logInfo(`Start publish ${sourceType}.`);

  const { targetPackageJson, targetConfig, targetRoot, targetPackageInfo } = prePareParamsBeforePublish(sourceType);

  // Change source config here
  pri.sourceConfig = targetConfig;
  pri.sourceRoot = targetRoot;
  pri.selectedSourceType = sourceType;

  await fs.remove(path.join(pri.projectRootPath, pri.sourceConfig.distDir));

  await checkEnvBeforePublish(targetPackageJson, sourceType);

  targetPackageJson.version = await generateVersion(
    options,
    isDevelopBranch,
    targetPackageJson,
    targetConfig,
    currentBranchName,
  );

  await upgradePackageVersionAndPush(sourceType, targetRoot, targetPackageJson);

  // Update version in depMao
  if (depMap) {
    depMap.forEach(value => {
      value.depMonoPackages.forEach(eachPackage => {
        if (eachPackage.name === sourceType) {
          // eslint-disable-next-line no-param-reassign
          eachPackage.packageJson.version = targetPackageJson.version;
        }
      });
    });
  }

  await buildComponent(targetPackageInfo);

  if (options.bundle) {
    await commandBundle({ skipLint: true });
  }

  await spinner(`Publish`, async () => {
    await moveSourceFilesToTempFolderAndPublish(sourceType, options, targetConfig, targetRoot, depMap, isDevelopBranch);
  });

  const tagName = generateTag(sourceType, targetPackageJson);

  await addTagAndPush(tagName, targetPackageJson);
}

/** publish the packages and its mono */
async function publishPackageAndItsMonoPackage(
  sourceType: string,
  options: PublishOption,
  depMap: DepMap,
  depMonoPackages: PackageInfo[],
  isDevelopBranch: boolean,
  currentBranchName: string,
) {
  logInfo(`Start publish ${sourceType}.`);

  const { targetPackageJson, targetConfig, targetRoot, targetPackageInfo } = prePareParamsBeforePublish(sourceType);

  // Change source config here
  pri.sourceConfig = targetConfig;
  pri.sourceRoot = targetRoot;
  pri.selectedSourceType = sourceType;

  await fs.remove(path.join(pri.projectRootPath, pri.sourceConfig.distDir));

  await checkEnvBeforePublish(targetPackageJson, sourceType);

  const monoPackageVersion: {
    [key in string]: string;
  } = {};

  // Generate all package version and upgrade

  await depMonoPackages.forEach(async item => {
    const version = await generateVersion(options, isDevelopBranch, item.packageJson, item.config, currentBranchName);

    monoPackageVersion[item.name as string] = version;

    item.packageJson.version = version;

    const rootPath = item.rootPath;

    await fs.outputFile(path.join(rootPath, 'package.json'), `${JSON.stringify(item.packageJson, null, 2)}\n`);
  });

  // Update depMonoPackages version

  depMonoPackages.forEach(item => {
    depMap.get(item.name).depMonoPackages.forEach(eachPackage => {
      eachPackage.packageJson.version = monoPackageVersion[eachPackage.packageJson.name];
    });
  });

  // current package version
  const currentVersion = await generateVersion(
    options,
    isDevelopBranch,
    targetPackageJson,
    targetConfig,
    currentBranchName,
  );

  targetPackageJson.version = currentVersion;

  await fs.outputFile(path.join(targetRoot, 'package.json'), `${JSON.stringify(targetPackageJson, null, 2)}\n`);

  if (!(await isWorkingTreeClean())) {
    const commitMessage = `upgrade ${sourceType} version to ${targetPackageJson.version} \n\n${depMonoPackages
      .map(i => `upgrade ${i.name} version to ${i.packageJson.version} \n\n`)
      .join('')}`;
    await exec(`git add -A; git commit -m "${commitMessage}" -n`, {
      cwd: pri.projectRootPath,
    });
  }

  // async publish queue & add tag and push
  const publishQueue = depMonoPackages.map(item => {
    return new Promise(async resolve => {
      await buildComponent(item);

      if (options.bundle) {
        await commandBundle({ skipLint: true });
      }

      await moveSourceFilesToTempFolderAndPublish(
        item.name,
        options,
        item.config,
        item.rootPath,
        depMap,
        isDevelopBranch,
      );

      await addTagAndPush(generateTag(item.name, item.packageJson), item.packageJson);
      resolve();
    });
  });

  // push current package into publishQueue
  publishQueue.push(
    new Promise(async resolve => {
      await buildComponent(targetPackageInfo);

      if (options.bundle) {
        await commandBundle({ skipLint: true });
      }

      await moveSourceFilesToTempFolderAndPublish(
        sourceType,
        options,
        targetConfig,
        targetRoot,
        depMap,
        isDevelopBranch,
      );

      await addTagAndPush(generateTag(sourceType, targetPackageJson), targetPackageJson);

      resolve();
    }),
  );

  await spinner(`Publish`, async () => {
    await Promise.all(publishQueue);
  });
}
