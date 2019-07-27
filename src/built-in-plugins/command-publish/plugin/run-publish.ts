import * as fs from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as commitLint from '@commitlint/lint';
import * as semver from 'semver';
import { execSync } from 'child_process';
import * as _ from 'lodash';
import * as pkg from '../../../../package.json';
import { PublishOption } from './interface';
import { exec } from '../../../utils/exec';
import { pri, tempPath, declarationPath } from '../../../node';
import { buildComponent } from '../../command-build/plugin/build';
import { commandBundle } from '../../command-bundle/plugin/command-bundle';
import { isWorkingTreeClean } from '../../../utils/git-operate';
import { logFatal, logInfo, spinner, logText } from '../../../utils/log';
import { getMonoAndNpmDepsOnce, DepMap } from '../../../utils/packages';
import { ProjectConfig } from '../../../utils/define';

export const publish = async (options: PublishOption) => {
  await pri.project.ensureProjectFiles();
  await pri.project.checkProjectFiles();

  if (!options.skipLint) {
    await pri.project.lint({
      lintAll: true,
      needFix: false,
      showBreakError: true
    });
  }

  const { depMonoPackages, depMap } = await getMonoAndNpmDepsOnce();

  if (depMonoPackages.length > 0) {
    const installAllPrompt = await inquirer.prompt([
      {
        message: `${pri.selectedSourceType} depends on monorepo ${depMonoPackages
          .map(eachPackage => `"${eachPackage.name}"`)
          .join(', ')} \n Do you want to publish these packages first?`,
        name: 'installAll',
        type: 'confirm'
      }
    ]);

    if (installAllPrompt.installAll) {
      for (const eachPackage of depMonoPackages) {
        await publishByPackageName(eachPackage.name, options, depMap);
      }
    }
  }

  switch (pri.sourceConfig.type) {
    case 'component':
    case 'plugin': {
      await publishByPackageName(pri.selectedSourceType, options, depMap);
      break;
    }
    case 'project':
    default:
    // Not sure what to do, so keep empty.
  }
};

async function publishByPackageName(sourceType: string, options: PublishOption, depMap: DepMap) {
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

  if (!targetPackageJson.name) {
    logFatal(`No name found in ${sourceType} package.json`);
  }

  if (!targetPackageJson.version) {
    logFatal(`No version found in ${sourceType} package.json`);
  }

  if (!(await isWorkingTreeClean())) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: 'Working tree is not clean, your commit message:',
        name: 'message',
        type: 'input'
      }
    ]);

    if (!inquirerInfo.message) {
      logFatal(`Need commit message`);
    }

    const result = await commitLint(inquirerInfo.message, {
      'body-leading-blank': [1, 'always'],
      'footer-leading-blank': [1, 'always'],
      'header-max-length': [2, 'always', 72],
      'scope-case': [2, 'always', 'lower-case'],
      'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
      'subject-empty': [2, 'never'],
      'subject-full-stop': [2, 'never', '.'],
      'type-case': [2, 'always', 'lower-case'],
      'type-empty': [2, 'never'],
      'type-enum': [2, 'always', ['build', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']]
    });

    if (!result.valid) {
      logFatal(`\n${result.errors.map((eachError: any) => eachError.message).join('\n')}`);
    }

    if (inquirerInfo.message) {
      await exec(`git add -A; git commit -m "${inquirerInfo.message}" -n`, { cwd: pri.projectRootPath });
    }
  }

  logInfo('Check if npm package exist');
  const versionResult = execSync(
    `${targetConfig.npmClient} view ${targetPackageJson.name}@${targetPackageJson.version} version`
  )
    .toString()
    .trim();

  let targetVersion = targetPackageJson.version;

  if (versionResult !== '') {
    if (!options.semver) {
      const versionPrompt = await inquirer.prompt([
        {
          message: `${targetPackageJson.name}@${targetPackageJson.version} exist, can upgrade to`,
          name: 'version',
          type: 'list',
          choices: [
            {
              name: `Patch(${semver.inc(targetPackageJson.version, 'patch')})`,
              value: semver.inc(targetPackageJson.version, 'patch')
            },
            {
              name: `Minor(${semver.inc(targetPackageJson.version, 'minor')})`,
              value: semver.inc(targetPackageJson.version, 'minor')
            },
            {
              name: `Major(${semver.inc(targetPackageJson.version, 'major')})`,
              value: semver.inc(targetPackageJson.version, 'major')
            }
          ]
        }
      ]);

      targetVersion = versionPrompt.version;
    } else if (['patch', 'minor', 'major'].some(each => each === options.semver)) {
      targetVersion = semver.inc(targetPackageJson.version, options.semver as semver.ReleaseType);
    } else {
      logFatal(`semver must be "patch" "minor" or "major"`);
    }

    // Upgrade package.json's version
    await fs.outputFile(
      path.join(targetRoot, 'package.json'),
      `${JSON.stringify(
        {
          ...targetPackageJson,
          version: targetVersion
        },
        null,
        2
      )}\n`
    );

    await exec(`git add -A; git commit -m "upgrade ${sourceType} version to ${targetVersion}" -n`, {
      cwd: pri.projectRootPath
    });
  }

  await buildComponent({ skipLint: true });

  if (options.bundle) {
    await commandBundle({ skipLint: true });
  }

  await spinner(`Publish`, async () => {
    await moveSourceFilesToTempFolderAndPublish(sourceType, options, targetConfig, targetRoot, depMap);
  });

  await spinner(`Add tag`, async () => {
    if (sourceType !== 'root') {
      await exec(`git tag -a ${sourceType}-v${targetVersion} -m "release"`);
    } else {
      await exec(`git tag -a v${targetVersion} -m "release"`);
    }
  });

  await spinner(`Push`, async () => {
    await exec(`git push --follow-tags`);
  });

  logText(`+ ${targetPackageJson.name}@${targetVersion}`);
}

async function moveSourceFilesToTempFolderAndPublish(
  sourceType: string,
  options: PublishOption,
  targetConfig: ProjectConfig,
  targetRoot: string,
  depMap: DepMap
) {
  const publishTempName = 'publish-temp';
  const tempRoot = path.join(pri.projectRootPath, tempPath.dir, publishTempName);

  await fs.remove(tempRoot);

  await fs.copy(path.join(pri.projectRootPath, targetConfig.distDir), path.join(tempRoot, targetConfig.distDir));
  await fs.copy(path.join(pri.projectRootPath, declarationPath.dir), path.join(tempRoot, declarationPath.dir));
  await fs.copy(path.join(targetRoot, 'package.json'), path.join(tempRoot, 'package.json'));

  // Add external deps
  const targetPackageJson = await fs.readJson(path.join(tempRoot, 'package.json'));
  const addedPackageJson = await addMissingDeps(sourceType, depMap, targetConfig);

  _.merge(targetPackageJson, addedPackageJson);
  await fs.outputJSON(path.join(tempRoot, 'package.json'), targetPackageJson);

  await exec(
    `${targetConfig.npmClient} publish ${tempRoot} --ignore-scripts ${
      options.tag ? `--tag ${options.tag}` : '--tag latest'
    }`,
    {
      cwd: tempRoot
    }
  );

  await fs.remove(tempRoot);
}

async function addMissingDeps(sourceType: string, depMap: DepMap, targetConfig: ProjectConfig) {
  const newPackageJson: any = {};

  if (targetConfig.npmClient === 'tnpm') {
    newPackageJson.publishConfig = {
      registry: 'https://registry.npm.alibaba-inc.com'
    };
  }

  if (depMap) {
    const { depMonoPackages, depNpmPackages } = depMap.get(sourceType);

    newPackageJson.dependencies = depMonoPackages.reduce((root, next) => {
      if (!next.packageJson.version) {
        logFatal(`${sourceType} depend on ${next.name}, but missing "version" in ${next.name}'s package.json`);
      }

      return {
        ...root,
        [next.packageJson.name]: `^${next.packageJson.version}`
      };
    }, {});

    if (sourceType !== 'root') {
      // Find depNpmPackages's version from rootPackageJson
      const projectPackageJsonDeps = (pri.projectPackageJson as any).dependencies || {};

      let sourceDeps: any = {};
      sourceDeps = {
        ...sourceDeps,
        ...projectPackageJsonDeps
      };

      // If root type is project, also find in pri deps.
      if (pri.projectConfig.type === 'project') {
        sourceDeps = {
          ...sourceDeps,
          ...(pkg.dependencies || {})
        };
      }

      newPackageJson.dependencies = {
        ...newPackageJson.dependencies,
        ...depNpmPackages
          .filter(npmName => !['react', 'react-dom', 'antd'].includes(npmName))
          .reduce((root, next) => {
            if (!sourceDeps[next]) {
              logFatal(
                `${pri.selectedSourceType}'s code depends on ${next}, but it doesn't exist in root package.json`
              );
            }

            return {
              ...root,
              [next]: sourceDeps[next]
            };
          }, {})
      };
    }
  }

  if (sourceType !== 'root') {
    _.set(newPackageJson, 'main', `${pri.projectConfig.distDir}/main`);
    _.set(newPackageJson, 'module', `${pri.projectConfig.distDir}/module`);
    _.set(newPackageJson, 'types', 'declaration/index.d.ts');
  }

  return newPackageJson;
}
