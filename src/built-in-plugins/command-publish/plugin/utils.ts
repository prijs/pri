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
import { isWorkingTreeClean } from '../../../utils/git-operate';
import { logFatal, spinner, logText, logInfo } from '../../../utils/log';
import { DepMap } from '../../../utils/packages';
import { ProjectConfig, PackageJson, PackageInfo } from '../../../utils/define';

// prePare the info before publish
export function prePareParamsBeforePublish(sourceType: string) {
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

  const targetPackageInfo: PackageInfo = {
    name: sourceType,
    rootPath: targetRoot,
    packageJson: targetPackageJson as PackageJson,
    config: targetConfig,
  };

  return {
    targetPackageJson,
    targetConfig,
    targetRoot,
    targetPackageInfo,
  };
}

// check package.json and env etc.
export async function checkEnvBeforePublish(targetPackageJson: Partial<PackageJson>, sourceType: string) {
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
}

export async function addTagAndPush(tagName: string, targetPackageJson: Partial<PackageJson>) {
  await spinner('Add and push tag', async () => {
    await exec(`git tag -a ${tagName} -m "release" -f`);
    await exec(`git push origin ${tagName} -f`);
  });

  logText(`+ ${targetPackageJson.name}@${targetPackageJson.version}`);
}

/** generate tag by sourceType */
export function generateTag(sourceType: string, targetPackageJson: Partial<PackageJson>) {
  if (sourceType !== 'root') {
    return `${sourceType}-v${targetPackageJson.version}`;
  }
  return `v${targetPackageJson.version}`;
}

/** generateVesion by user or command options */
export async function generateVersion(
  options: PublishOption,
  isDevelopBranch: boolean,
  targetPackageJson: Partial<PackageJson>,
  targetConfig: ProjectConfig,
  currentBranchName: string,
) {
  let versionResult: string = null;

  let version = '';

  try {
    const versionResultExec = execSync(
      `${targetConfig.npmClient} view ${targetPackageJson.name}@${targetPackageJson.version} version`,
    );

    if (versionResultExec) {
      versionResult = versionResultExec.toString().trim();
    } else {
      versionResult = null;
    }
  } catch (error) {
    // Throw error means not exist
    versionResult = null;
  }

  // Generate beta version if branch is not master or develop
  if (options.tag === 'beta' || !isDevelopBranch) {
    // fixed basicVersion to 1.0.0
    const basicVersion = '1.0.0';

    const branchNameInVersion = currentBranchName.replace(/\//g, '').replace(/\./g, '');

    let publishedVersions: string[] = [];
    try {
      // all of package versions
      const tempVersions = execSync(`${targetConfig.npmClient} view ${targetPackageJson.name} versions`);
      if (tempVersions) {
        publishedVersions = tempVersions
          .toString()
          .trim()
          .replace(/\n|'| |\[|\]/g, '')
          .split(',');
      } else {
        publishedVersions = [];
      }
    } catch (e) {
      publishedVersions = [];
    }

    let maxBetaVersionNum = 0;

    // 1.0.0-branchName.version
    const betaVersionReg = new RegExp(`\\d+\\.\\d+\\.\\d+-${branchNameInVersion}\\.\\d+`);

    // get max beta version
    publishedVersions.forEach((v: string) => {
      if (betaVersionReg.test(v)) {
        const tempBetaVersion = Number(v.split(`${branchNameInVersion}.`)[1]);

        if (maxBetaVersionNum < tempBetaVersion) {
          maxBetaVersionNum = tempBetaVersion;
        }
      }
    });

    // basic version without branchName -> use basic version + branch name + beta version
    version = `${basicVersion}-${branchNameInVersion}.${maxBetaVersionNum + 1}`;
  } else if (versionResult) {
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
      version = versionPrompt.version;
    } else if (['patch', 'minor', 'major'].some(each => each === options.semver)) {
      version = semver.inc(targetPackageJson.version, options.semver as semver.ReleaseType);
    } else {
      logFatal('semver must be "patch" "minor" or "major"');
    }
  }
  return version;
}

/** Upgrade package.json's version */
export async function upgradePackageVersionAndPush(
  sourceType: string,
  targetRoot: string,
  targetPackageJson: Partial<PackageJson>,
) {
  await fs.outputFile(path.join(targetRoot, 'package.json'), `${JSON.stringify(targetPackageJson, null, 2)}\n`);

  if (!(await isWorkingTreeClean())) {
    await exec(`git add -A; git commit -m "upgrade ${sourceType} version to ${targetPackageJson.version}" -n`, {
      cwd: pri.projectRootPath,
    });
  }
}

/** Clean WorkingTree with commintLint */
export async function cleanWorkingTree() {
  const inquirerInfo = await inquirer.prompt([
    {
      message: 'Working tree is not clean, your commit message:',
      name: 'message',
      type: 'input',
    },
  ]);

  if (!inquirerInfo.message) {
    logFatal('Need commit message');
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
    await exec(`git add -A; git commit -m "${inquirerInfo.message}" -n`, {
      cwd: pri.projectRootPath,
    });
  }
}

export async function moveSourceFilesToTempFolderAndPublish(
  sourceType: string,
  options: PublishOption,
  targetConfig: ProjectConfig,
  targetRoot: string,
  depMap: DepMap,
  isDevelopBranch: boolean,
) {
  const publishTempName = 'publish-temp';
  const tempRoot = path.join(pri.projectRootPath, tempPath.dir, publishTempName, sourceType);

  await fs.remove(tempRoot);

  await fs.copy(
    path.join(pri.projectRootPath, targetConfig.distDir, sourceType),
    path.join(tempRoot, targetConfig.distDir),
  );
  await copyDeclaration(sourceType, publishTempName);
  await fs.copy(path.join(targetRoot, 'package.json'), path.join(tempRoot, 'package.json'));

  // Add external deps
  const targetPackageJson = await fs.readJson(path.join(tempRoot, 'package.json'));
  const addedPackageJson = await addMissingDeps(options, sourceType, depMap, targetConfig, isDevelopBranch);

  _.merge(targetPackageJson, addedPackageJson);
  await fs.outputFile(path.join(tempRoot, 'package.json'), JSON.stringify(targetPackageJson, null, 2));

  let finalTag = options.tag || 'latest';

  if (!isDevelopBranch) {
    finalTag = 'beta';
  }

  await exec(`${targetConfig.npmClient} publish ${tempRoot} --ignore-scripts --tag ${finalTag}`, {
    cwd: tempRoot,
  });

  await fs.remove(tempRoot);
}

export async function addMissingDeps(
  options: PublishOption,
  sourceType: string,
  depMap: DepMap,
  targetConfig: ProjectConfig,
  isDevelopBranch: boolean,
) {
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

      let prefix = '^';

      if (options.tag === 'beta' || !isDevelopBranch) {
        prefix = '';
      }

      return {
        ...root,
        [next.packageJson.name]: `${prefix}${next.packageJson.version}`,
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

      // add nested deps
      sourceDeps = {
        ...sourceDeps,
        history: '*',
      };

      newPackageJson.dependencies = {
        ...newPackageJson.dependencies,
        ...depNpmPackages
          .filter(npmName => !['react', 'react-dom', 'antd'].includes(npmName))
          .reduce((root, next) => {
            if (!sourceDeps[next]) {
              logFatal(`package ${sourceType}'s code depends on "${next}", but it doesn't exist in root package.json`);
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

export async function buildDeclaration() {
  // Create d.ts
  await spinner('create declaration', async () => {
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

export async function copyDeclaration(sourceType: string, publishTempName: string) {
  const declarationRoot = path.join(pri.projectRootPath, tempPath.dir, declarationPath.dir);

  const srcPathExtra = pri.packages.length > 0 ? srcPath.dir : '';

  // If select packages, pick it's own declaration
  if (sourceType !== 'root') {
    const declarationFiles = glob.sync(path.join(declarationRoot, 'packages', sourceType, srcPathExtra, '/**/*.d.ts'));

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(path.join(declarationRoot, 'packages', sourceType, srcPathExtra), eachFile);
      fs.copySync(
        eachFile,
        path.join(pri.projectRootPath, tempPath.dir, publishTempName, sourceType, declarationPath.dir, targetPath),
      );
    });
  } else {
    // get declaration from src
    const declarationFiles = glob.sync(path.join(declarationRoot, srcPathExtra, '**/*.d.ts'));

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(path.join(declarationRoot, srcPathExtra), eachFile);
      fs.copySync(
        eachFile,
        path.join(pri.projectRootPath, tempPath.dir, publishTempName, sourceType, declarationPath.dir, targetPath),
      );
    });
  }
}
