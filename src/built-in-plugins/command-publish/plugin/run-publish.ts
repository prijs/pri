import * as fs from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as commitLint from '@commitlint/lint';
import * as semver from 'semver';
import { execSync } from 'child_process';
import { PublishOption } from './interface';
import { exec } from '../../../utils/exec';
import { pri, tempPath, declarationPath } from '../../../node';
import { buildComponent } from '../../command-build/plugin/build';
import { commandBundle } from '../../command-bundle/plugin/command-bundle';
import { isWorkingTreeClean } from '../../../utils/git-operate';
import { logFatal } from '../../../utils/log';

export const publish = async (options: PublishOption) => {
  switch (pri.sourceConfig.type) {
    case 'component':
    case 'plugin': {
      const targetPackageJson =
        pri.selectedSourceType === 'root'
          ? pri.projectPackageJson || {}
          : pri.packages.find(eachPackage => eachPackage.name === pri.selectedSourceType).packageJson || {};

      if (!targetPackageJson.name) {
        logFatal(`No name found in ${pri.selectedSourceType} package.json`);
      }

      if (!targetPackageJson.version) {
        logFatal(`No version found in ${pri.selectedSourceType} package.json`);
      }

      const versionResult = execSync(
        `${pri.sourceConfig.npmClient} view ${targetPackageJson.name}@${targetPackageJson.version} version`
      )
        .toString()
        .trim();

      if (versionResult !== '') {
        const versionPrompt = await inquirer.prompt([
          {
            message: `${targetPackageJson.name}@${targetPackageJson.version} exist, you can upgrade version to`,
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

        // Upgrade package.json's version
        await fs.outputFile(
          path.join(pri.sourceRoot, 'package.json'),
          `${JSON.stringify(
            {
              ...targetPackageJson,
              version: versionPrompt.version
            },
            null,
            2
          )}\n`
        );
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
          'type-enum': [
            2,
            'always',
            ['build', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']
          ]
        });

        if (!result.valid) {
          logFatal(`\n${result.errors.map((eachError: any) => eachError.message).join('\n')}`);
        }

        if (inquirerInfo.message) {
          await exec(`git add -A; git commit -m "${inquirerInfo.message}" -n`, { cwd: pri.projectRootPath });
        }
      }

      if (!options.skipLint) {
        await pri.project.lint({
          lintAll: true,
          needFix: false,
          showBreakError: true
        });
      }

      await buildComponent({ skipLint: true });

      if (options.bundle) {
        await commandBundle({ skipLint: true });
      }

      await moveSourceFilesToTempFolderAndPublish(options);
      break;
    }
    case 'project':
    default:
    // Not sure what to do, so keep empty.
  }
};

async function moveSourceFilesToTempFolderAndPublish(options: PublishOption) {
  const publishTempName = 'publish-temp';
  const tempRoot = path.join(pri.projectRootPath, tempPath.dir, publishTempName);

  await fs.remove(tempRoot);

  await fs.copy(
    path.join(pri.projectRootPath, pri.sourceConfig.distDir),
    path.join(tempRoot, pri.sourceConfig.distDir)
  );
  await fs.copy(path.join(pri.projectRootPath, declarationPath.dir), path.join(tempRoot, declarationPath.dir));
  await fs.copy(path.join(pri.sourceRoot, 'package.json'), path.join(tempRoot, 'package.json'));

  await exec(
    `${pri.sourceConfig.npmClient} publish ${tempRoot} --ignore-scripts ${
      options.tag ? `--tag ${options.tag}` : '--tag latest'
    }`,
    {
      cwd: tempRoot
    }
  );

  await fs.remove(tempRoot);
}
