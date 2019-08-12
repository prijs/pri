import * as fs from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as commitLint from '@commitlint/lint';
import * as semver from 'semver';
import { execSync } from 'child_process';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as pkg from '../../../../package.json';
import { PublishOption } from './interface';
import { exec } from '../../../utils/exec';
import { pri, tempPath, declarationPath, srcPath } from '../../../node';
import { buildComponent } from '../../command-build/plugin/build';
import { commandBundle } from '../../command-bundle/plugin/command-bundle';
import { isWorkingTreeClean } from '../../../utils/git-operate';
import { logFatal, logInfo, spinner, logText } from '../../../utils/log';
import { getMonoAndNpmDepsOnce, DepMap } from '../../../utils/packages';
import { ProjectConfig } from '../../../utils/define';

export const publish = async (options: PublishOption) => {
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
                .join(', ')} \n Do you want to publish these packages first?`,
              name: 'installAll',
              type: 'confirm',
            },
          ]);

          await buildDeclaration();

          if (installAllPrompt.installAll) {
            for (const eachPackage of depMonoPackages) {
              await publishByPackageName(eachPackage.name, options, depMap);
            }
          }
        } else {
          await buildDeclaration();
        }

        await publishByPackageName(currentSelectedSourceType, options, depMap);

        await fs.remove(path.join(pri.projectRootPath, tempPath.dir, declarationPath.dir));
      }
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

  if (!(await isWorkingTreeClean())) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: 'Working tree is not clean, your commit message:',
        name: 'message',
        type: 'input',
      },
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
      'type-enum': [2, 'always', ['build', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']],
    });

    if (!result.valid) {
      logFatal(`\n${result.errors.map((eachError: any) => eachError.message).join('\n')}`);
    }

    if (inquirerInfo.message) {
      await exec(`git add -A; git commit -m "${inquirerInfo.message}" -n`, { cwd: pri.projectRootPath });
    }
  }

  logInfo('Check if npm package exist');

  let versionResult = '';

  try {
    versionResult = execSync(
      `${targetConfig.npmClient} view ${targetPackageJson.name}@${targetPackageJson.version} version`,
      {
        stdio: 'ignore',
      },
    )
      .toString()
      .trim();
  } catch {
    // Throw error means not exist
    versionResult = '';
  }

  if (options.tag === 'beta') {
    targetPackageJson.version = (semver.inc as any)(targetPackageJson.version, 'prerelease', 'beta');
    await fs.outputFile(path.join(targetRoot, 'package.json'), `${JSON.stringify(targetPackageJson, null, 2)}\n`);

    await exec(`git add -A; git commit -m "upgrade ${sourceType} version to ${targetPackageJson.version}" -n`, {
      cwd: pri.projectRootPath,
    });
  } else if (versionResult !== '') {
    if (!options.semver) {
      const versionPrompt = await inquirer.prompt([
        {
          message: `${targetPackageJson.name}@${targetPackageJson.version} exist, can upgrade to`,
          name: 'version',
          type: 'list',
          choices: [
            {
              name: `Patch(${semver.inc(targetPackageJson.version, 'patch')})`,
              value: semver.inc(targetPackageJson.version, 'patch'),
            },
            {
              name: `Minor(${semver.inc(targetPackageJson.version, 'minor')})`,
              value: semver.inc(targetPackageJson.version, 'minor'),
            },
            {
              name: `Major(${semver.inc(targetPackageJson.version, 'major')})`,
              value: semver.inc(targetPackageJson.version, 'major'),
            },
          ],
        },
      ]);

      targetPackageJson.version = versionPrompt.version;
    } else if (['patch', 'minor', 'major'].some(each => each === options.semver)) {
      targetPackageJson.version = semver.inc(targetPackageJson.version, options.semver as semver.ReleaseType);
    } else {
      logFatal(`semver must be "patch" "minor" or "major"`);
    }

    // Upgrade package.json's version
    await fs.outputFile(path.join(targetRoot, 'package.json'), `${JSON.stringify(targetPackageJson, null, 2)}\n`);

    await exec(`git add -A; git commit -m "upgrade ${sourceType} version to ${targetPackageJson.version}" -n`, {
      cwd: pri.projectRootPath,
    });
  }

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
    await moveSourceFilesToTempFolderAndPublish(sourceType, options, targetConfig, targetRoot, depMap);
  });

  await spinner(`Add tag`, async () => {
    if (sourceType !== 'root') {
      await exec(`git tag -a ${sourceType}-v${targetPackageJson.version} -m "release"`);
    } else {
      await exec(`git tag -a v${targetPackageJson.version} -m "release"`);
    }
  });

  await spinner(`Push`, async () => {
    await exec(`git push --follow-tags`);
  });

  logText(`+ ${targetPackageJson.name}@${targetPackageJson.version}`);
}

async function moveSourceFilesToTempFolderAndPublish(
  sourceType: string,
  options: PublishOption,
  targetConfig: ProjectConfig,
  targetRoot: string,
  depMap: DepMap,
) {
  const publishTempName = 'publish-temp';
  const tempRoot = path.join(pri.projectRootPath, tempPath.dir, publishTempName);

  await fs.remove(tempRoot);

  await fs.copy(path.join(pri.projectRootPath, targetConfig.distDir), path.join(tempRoot, targetConfig.distDir));
  await copyDeclaration(sourceType, publishTempName);
  await fs.copy(path.join(targetRoot, 'package.json'), path.join(tempRoot, 'package.json'));

  // Add external deps
  const targetPackageJson = await fs.readJson(path.join(tempRoot, 'package.json'));
  const addedPackageJson = await addMissingDeps(sourceType, depMap, targetConfig);

  _.merge(targetPackageJson, addedPackageJson);
  await fs.outputFile(path.join(tempRoot, 'package.json'), JSON.stringify(targetPackageJson, null, 2));

  await exec(
    `${targetConfig.npmClient} publish ${tempRoot} --ignore-scripts ${
      options.tag ? `--tag ${options.tag}` : '--tag latest'
    }`,
    {
      cwd: tempRoot,
    },
  );

  await fs.remove(tempRoot);
}

async function addMissingDeps(sourceType: string, depMap: DepMap, targetConfig: ProjectConfig) {
  const newPackageJson: any = {};

  if (targetConfig.npmClient === 'tnpm') {
    newPackageJson.publishConfig = {
      registry: 'https://registry.npm.alibaba-inc.com',
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
        [next.packageJson.name]: `^${next.packageJson.version}`,
      };
    }, {});

    if (sourceType !== 'root') {
      // Find depNpmPackages's version from rootPackageJson
      const projectPackageJsonDeps = (pri.projectPackageJson as any).dependencies || {};

      let sourceDeps: any = {};
      sourceDeps = {
        ...sourceDeps,
        ...projectPackageJsonDeps,
      };

      // If root type is project, also find in pri deps.
      if (pri.projectConfig.type === 'project') {
        sourceDeps = {
          ...sourceDeps,
          ...(pkg.dependencies || {}),
        };
      }

      newPackageJson.dependencies = {
        ...newPackageJson.dependencies,
        ...depNpmPackages
          .filter(npmName => !['react', 'react-dom', 'antd'].includes(npmName))
          .reduce((root, next) => {
            if (!sourceDeps[next]) {
              logFatal(
                `${pri.selectedSourceType}'s code depends on ${next}, but it doesn't exist in root package.json`,
              );
            }

            return {
              ...root,
              [next]: sourceDeps[next],
            };
          }, {}),
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

async function buildDeclaration() {
  // Create d.ts
  await spinner(`create declaration`, async () => {
    try {
      await exec(
        `npx tsc --declaration --declarationDir ${path.join(
          pri.projectRootPath,
          `./${tempPath.dir}/${declarationPath.dir}`,
        )} --emitDeclarationOnly >> /dev/null 2>&1`,
        {
          cwd: pri.projectRootPath,
        },
      );
    } catch {
      //
    }
  });
}

async function copyDeclaration(sourceType: string, publishTempName: string) {
  const declarationRoot = path.join(pri.projectRootPath, tempPath.dir, declarationPath.dir);

  // If select packages, pick it's own declaration
  if (sourceType !== 'root') {
    const declarationFiles = glob.sync(path.join(declarationRoot, 'packages', sourceType, srcPath.dir, '/**/*.d.ts'));

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(path.join(declarationRoot, 'packages', sourceType, srcPath.dir), eachFile);
      fs.copySync(
        eachFile,
        path.join(pri.projectRootPath, tempPath.dir, publishTempName, declarationPath.dir, targetPath),
      );
    });
  } else {
    // get declaration from src
    const declarationFiles = glob.sync(path.join(declarationRoot, srcPath.dir, '**/*.d.ts'));

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(path.join(declarationRoot, srcPath.dir), eachFile);
      fs.copySync(
        eachFile,
        path.join(pri.projectRootPath, tempPath.dir, publishTempName, declarationPath.dir, targetPath),
      );
    });
  }
}
