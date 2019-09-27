import * as fs from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { execSync } from 'child_process';
import * as _ from 'lodash';
import { PublishOption } from './interface';
import { exec } from '../../../utils/exec';
import { pri, tempPath, declarationPath } from '../../../node';
import { buildComponent } from '../../command-build/plugin/build';
import { commandBundle } from '../../command-bundle/plugin/command-bundle';
import { isWorkingTreeClean, getCurrentBranchName } from '../../../utils/git-operate';
import { logFatal, logInfo, spinner } from '../../../utils/log';
import { getMonoAndNpmDepsOnce, DepMap } from '../../../utils/packages';
import { PackageInfo } from '../../../utils/define';
import {
  buildDeclaration,
  generateVersion,
  addTagAndPush,
  moveSourceFilesToTempFolderAndPublish,
  cleanWorkingTree,
  upgradePackageVersionAndPush,
  generateTag,
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

          if (installAllPrompt.publishAllPackages && currentSelectedSourceType === 'root') {
            // parallel publish root
            await publishPackageAndItsMonoPackage(
              currentSelectedSourceType,
              options,
              depMap,
              depMonoPackages,
              isDevelopBranch,
              currentBranchName,
            );
          } else if (installAllPrompt.publishAllPackages && currentSelectedSourceType !== 'root') {
            // Serial publish non root situation TODO: change to parallel
            for (const eachPackage of depMonoPackages) {
              await publishByPackageName(eachPackage.name, options, depMap, isDevelopBranch, currentBranchName);
            }
          }
        } else {
          await buildDeclaration();
          await publishByPackageName(currentSelectedSourceType, options, depMap, isDevelopBranch, currentBranchName);
        }

        await fs.remove(path.join(pri.projectRootPath, tempPath.dir, declarationPath.dir));

        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
          .toString('utf8')
          .trim();
        await exec(`git push origin ${currentBranch}`);
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

  const targetPackageJson =
    sourceType === 'root'
      ? pri.projectPackageJson || {}
      : pri.packages.find(eachPackage => eachPackage.name === sourceType).packageJson || {};

  const targetConfig =
    sourceType === 'root'
      ? pri.projectConfig
      : pri.packages.find(eachPackage => eachPackage.name === sourceType).config;

  const targetRoot =
    sourceType === 'root'
      ? pri.projectRootPath
      : pri.packages.find(eachPackage => eachPackage.name === sourceType).rootPath;

  await fs.remove(path.join(pri.projectRootPath, pri.sourceConfig.distDir));

  // Change source config here
  pri.sourceConfig = targetConfig;
  pri.sourceRoot = targetRoot;
  pri.selectedSourceType = sourceType;

  if (!targetPackageJson.name) {
    logFatal(`No name found in ${sourceType} package.json`);
  }

  if (!targetPackageJson.version) {
    logFatal(`No version found in ${sourceType} package.json`);
  }

  // clean workingTree before publish
  if (!(await isWorkingTreeClean())) {
    await cleanWorkingTree();
  }

  logInfo('Check if npm package exist');

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

  await buildComponent();

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

  const currentPackageJson =
    sourceType === 'root'
      ? pri.projectPackageJson || {}
      : pri.packages.find(eachPackage => eachPackage.name === sourceType).packageJson || {};

  const currentConfig =
    sourceType === 'root'
      ? pri.projectConfig
      : pri.packages.find(eachPackage => eachPackage.name === sourceType).config;

  const currentRoot =
    sourceType === 'root'
      ? pri.projectRootPath
      : pri.packages.find(eachPackage => eachPackage.name === sourceType).rootPath;

  await fs.remove(path.join(pri.projectRootPath, pri.sourceConfig.distDir));

  // Change source config here
  pri.sourceConfig = currentConfig;
  pri.sourceRoot = currentRoot;
  pri.selectedSourceType = sourceType;

  if (!currentPackageJson.name) {
    logFatal(`No name found in ${sourceType} package.json`);
  }

  if (!currentPackageJson.version) {
    logFatal(`No version found in ${sourceType} package.json`);
  }

  const monoPackageVersion: {
    [key in string]: string;
  } = {};

  if (sourceType === 'root') {
    // Generate all package version and upgrade
    await depMonoPackages.forEach(async item => {
      const version = await generateVersion(options, isDevelopBranch, item.packageJson, item.config, currentBranchName);

      monoPackageVersion[item.name as string] = version;

      item.packageJson.version = version;

      const rootPath = depMonoPackages.find(eachPackage => eachPackage.name === item.name).rootPath;

      await fs.outputFile(path.join(rootPath, 'package.json'), `${JSON.stringify(item.packageJson, null, 2)}\n`);
    });

    // Update depMonoPackages version
    if (depMap) {
      depMap.forEach(value => {
        value.depMonoPackages.forEach(eachPackage => {
          eachPackage.packageJson.version = monoPackageVersion[eachPackage.packageJson.name];
        });
      });
    }
  } else {
    // TODO: add non root situation, the packages dep relation
  }

  // current package version
  const projectVersion = await generateVersion(
    options,
    isDevelopBranch,
    currentPackageJson,
    currentConfig,
    currentBranchName,
  );

  currentPackageJson.version = projectVersion;

  await fs.outputFile(path.join(currentRoot, 'package.json'), `${JSON.stringify(currentPackageJson, null, 2)}\n`);

  if (!(await isWorkingTreeClean())) {
    const commitMessage = `upgrade ${sourceType} version to ${currentPackageJson.version} \n\n${depMonoPackages
      .map(i => `upgrade ${i.name} version to ${i.packageJson.version} \n\n`)
      .join('')}`;
    await exec(`git add -A; git commit -m "${commitMessage}" -n`, {
      cwd: pri.projectRootPath,
    });
  }

  await buildComponent();

  if (options.bundle) {
    await commandBundle({ skipLint: true });
  }

  /** parallel publish queue & tag with push */
  const publishQueue = depMonoPackages.map(item => {
    return new Promise(async resolve => {
      await moveSourceFilesToTempFolderAndPublish(
        item.name,
        options,
        item.config,
        pri.packages.find(eachPackage => eachPackage.name === item.name).rootPath,
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
      await moveSourceFilesToTempFolderAndPublish(
        sourceType,
        options,
        currentConfig,
        currentRoot,
        depMap,
        isDevelopBranch,
      );

      await addTagAndPush(generateTag(sourceType, currentPackageJson), currentPackageJson);

      resolve();
    }),
  );

  await spinner(`Publish`, async () => {
    await Promise.all(publishQueue);
  });
}
