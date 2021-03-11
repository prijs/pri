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
import { isWorkingTreeClean, getCurrentBranchName } from '../../../utils/git-operate';
import { logFatal, logInfo, spinner, logText } from '../../../utils/log';
import { getMonoAndNpmDepsOnce, DepMap } from '../../../utils/packages';
import { ProjectConfig } from '../../../utils/define';
import { isOwner } from '../../../utils/npm';
import { README_FILE } from '../../../utils/constants';

export const publish = async (options: PublishOption) => {
  const currentBranchName = options.branch ? options.branch : await getCurrentBranchName();
  const isDevelopBranch = ['master', 'develop'].includes(currentBranchName);

  switch (pri.sourceConfig.type) {
    case 'component':
    case 'plugin': {
      if (!options.skipNpm) {
        await pri.project.ensureProjectFiles();
        await pri.project.checkProjectFiles();

        const currentSelectedSourceType = pri.selectedSourceType;
        const selectedPkgJson =
          currentSelectedSourceType === 'root'
            ? pri.projectPackageJson
            : pri.packages.find(p => p.name === currentSelectedSourceType)?.packageJson;

        if (!options.skipLint) {
          await pri.project.lint({
            lintAll: true,
            needFix: false,
            showBreakError: true,
          });
        }

        const { depMonoPackages, depMap } = await getMonoAndNpmDepsOnce();

        if (depMonoPackages.length > 0) {
          let includeAllPrompt = { includeAll: false };

          if (options.includeAll) {
            includeAllPrompt = { includeAll: true };
          } else {
            includeAllPrompt = await inquirer.prompt([
              {
                message: `${pri.selectedSourceType} depends on monorepo ${depMonoPackages
                  .map(eachPackage => `"${eachPackage.name}"`)
                  .join(', ')} \n Do you want to publish these packages first?`,
                name: 'includeAll',
                type: 'confirm',
              },
            ]);
          }

          // eslint-disable-next-line babel/no-unused-expressions
          !options.commitOnly && (await buildDeclaration());

          if (includeAllPrompt.includeAll) {
            const unPublishList = pri.sourceConfig?.unPublishList || [];
            const authList = [selectedPkgJson?.name, ...depMonoPackages.map(v => v.packageJson.name)]
              .filter(n => !!n)
              .filter(item => unPublishList.indexOf(item) === -1);
            await authPublish(authList);
            for (const eachPackage of depMonoPackages) {
              if (unPublishList.indexOf(eachPackage.packageJson.name) === -1) {
                await publishByPackageName(eachPackage.name, options, depMap, isDevelopBranch, currentBranchName);
              }
            }
          }
        } else {
          // eslint-disable-next-line babel/no-unused-expressions
          !options.commitOnly && (await buildDeclaration());
        }
        if (selectedPkgJson?.name) {
          await authPublish([selectedPkgJson.name]);
        }
        await publishByPackageName(currentSelectedSourceType, options, depMap, isDevelopBranch, currentBranchName);

        await fs.remove(path.join(pri.projectRootPath, tempPath.dir, declarationPath.dir));
        // eslint-disable-next-line babel/no-unused-expressions
        !options.publishOnly && (await exec(`git push origin ${currentBranchName}`));
      }
      break;
    }
    case 'project':
    default:
    // Not sure what to do, so keep empty.
  }
  // eslint-disable-next-line babel/no-unused-expressions
  options.exitAfterPublish && process.exit(0);
};

async function authPublish(packageNames: string[]) {
  const getUserName = (npmClient = 'npm') => {
    let name: string;
    try {
      const nameRet = execSync(`${npmClient} whoami`);
      name = nameRet.toString().trim();
    } catch (error) {
      logFatal(error);
    }
    return name;
  };

  const failedPkgSet = new Set<string>();
  const checkOwner = (uName: string, pName: string, npmClient?: string) =>
    new Promise((res, rej) => {
      isOwner(uName, pName, npmClient)
        .then(v => {
          if (!v) {
            failedPkgSet.add(pName);
          }
          res(v);
        })
        .catch(e => rej(e));
    });

  const pkgsP = packageNames.map(p => {
    const packageConfig =
      p === pri.projectPackageJson.name
        ? pri.projectConfig
        : pri.packages.find(eachPackage => eachPackage.packageJson.name === p)?.config;
    return checkOwner(getUserName(packageConfig?.npmClient), p, packageConfig?.npmClient);
  });
  await Promise.all(pkgsP);
  if (failedPkgSet.size > 0) {
    logFatal(`Permission error: need ownership to publish these packages. \n ${Array.from(failedPkgSet).join('\n')}`);
  }
}

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

  if (!options.publishOnly && !(await isWorkingTreeClean())) {
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
      await exec(`git add -A; git commit -m "${inquirerInfo.message}" -n`, {
        cwd: pri.projectRootPath,
      });
    }
  }

  let versionResult: string = null;

  if (options.tag !== 'beta' && isDevelopBranch) {
    logInfo('Check if npm package exist');

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
  }

  // Publish beta version if branch is not master or develop
  if (!options.publishOnly) {
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
      targetPackageJson.version = `${basicVersion}-${branchNameInVersion}.${maxBetaVersionNum + 1}`;

      await fs.outputFile(path.join(targetRoot, 'package.json'), `${JSON.stringify(targetPackageJson, null, 2)}\n`);

      if (!(await isWorkingTreeClean())) {
        await exec(`git add -A; git commit -m "upgrade ${sourceType} version to ${targetPackageJson.version}" -n`, {
          cwd: pri.projectRootPath,
        });
      }
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

        targetPackageJson.version = versionPrompt.version;
      } else if (['patch', 'minor', 'major'].some(each => each === options.semver)) {
        targetPackageJson.version = semver.inc(targetPackageJson.version, options.semver as semver.ReleaseType);
      } else {
        logFatal(`semver must be "patch" "minor" or "major"`);
      }

      // Upgrade package.json's version
      await fs.outputFile(path.join(targetRoot, 'package.json'), `${JSON.stringify(targetPackageJson, null, 2)}\n`);

      if (!(await isWorkingTreeClean())) {
        await exec(`git add -A; git commit -m "upgrade ${sourceType} version to ${targetPackageJson.version}" -n`, {
          cwd: pri.projectRootPath,
        });
      }
    }
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
  if (!options.commitOnly) {
    await buildComponent();

    if (options.bundle) {
      await commandBundle({ skipLint: true });
    }

    await spinner(`Publish`, async () => {
      await moveSourceFilesToTempFolderAndPublish(
        sourceType,
        options,
        targetConfig,
        targetRoot,
        depMap,
        isDevelopBranch,
      );
    });
  }

  logText(`+ ${targetPackageJson.name}@${targetPackageJson.version}`);
}

async function moveSourceFilesToTempFolderAndPublish(
  sourceType: string,
  options: PublishOption,
  targetConfig: ProjectConfig,
  targetRoot: string,
  depMap: DepMap,
  isDevelopBranch: boolean,
) {
  const publishTempName = 'publish-temp';
  const tempRoot = path.join(pri.projectRootPath, tempPath.dir, publishTempName);

  await fs.remove(tempRoot);

  if (pri.sourceConfig.materialComponent) {
    await fs.copy(path.join(pri.sourceRoot, 'es'), path.join(tempRoot, 'es'));
    await fs.copy(path.join(pri.sourceRoot, 'lib'), path.join(tempRoot, 'lib'));
  } else {
    await fs.copy(path.join(pri.projectRootPath, targetConfig.distDir), path.join(tempRoot, targetConfig.distDir));
  }
  await copyDeclaration(sourceType, publishTempName);
  await fs.copy(path.join(targetRoot, 'package.json'), path.join(tempRoot, 'package.json'));

  if (fs.existsSync(path.join(targetRoot, README_FILE))) {
    await fs.copy(path.join(targetRoot, README_FILE), path.join(tempRoot, README_FILE));
  } else if (fs.existsSync(path.join(targetRoot, README_FILE.toLowerCase()))) {
    await fs.copy(path.join(targetRoot, README_FILE.toLowerCase()), path.join(tempRoot, README_FILE));
  }

  // Add external deps
  const targetPackageJson = await fs.readJson(path.join(tempRoot, 'package.json'));
  const addedPackageJson = await addMissingDeps(options, sourceType, depMap, targetConfig, isDevelopBranch);

  _.merge(targetPackageJson, addedPackageJson);
  await fs.outputFile(path.join(tempRoot, 'package.json'), JSON.stringify(targetPackageJson, null, 2));

  let finalTag = options.tag || 'latest';

  if (!isDevelopBranch) {
    finalTag = 'beta';
  }

  await exec(`${targetConfig.npmClient} publish ${tempRoot} --ignore-scripts --silent --tag ${finalTag}`, {
    cwd: tempRoot,
  });

  await fs.remove(tempRoot);
}

async function addMissingDeps(
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
    if (pri.sourceConfig.materialComponent) {
      _.set(newPackageJson, 'main', `lib`);
      _.set(newPackageJson, 'module', `es`);
    } else {
      _.set(newPackageJson, 'main', `${pri.projectConfig.distDir}/main`);
      _.set(newPackageJson, 'module', `${pri.projectConfig.distDir}/module`);
      _.set(newPackageJson, 'esm5', `${pri.projectConfig.distDir}/esm5`);
    }
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

  const srcPathExtra = pri.packages.length > 0 ? srcPath.dir : '';

  // If select packages, pick it's own declaration
  if (sourceType !== 'root') {
    const declarationSourceRoot = path.join(
      declarationRoot,
      path.relative(pri.projectRootPath, pri.packages.find(each => each.name === sourceType).rootPath),
      srcPathExtra,
    );

    const declarationFiles = glob.sync(path.join(declarationSourceRoot, '/**/*.d.ts'));

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(declarationSourceRoot, eachFile);

      fs.copySync(
        eachFile,
        path.join(pri.projectRootPath, tempPath.dir, publishTempName, declarationPath.dir, targetPath),
      );
    });
  } else {
    // get declaration from src
    const declarationFiles = glob.sync(path.join(declarationRoot, srcPathExtra, '**/*.d.ts'));

    declarationFiles.map(eachFile => {
      const targetPath = path.relative(path.join(declarationRoot, srcPathExtra), eachFile);
      fs.copySync(
        eachFile,
        path.join(pri.projectRootPath, tempPath.dir, publishTempName, declarationPath.dir, targetPath),
      );
    });
  }
}
