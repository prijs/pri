import { execSync } from 'child_process';
import * as path from 'path';
import { pri } from '../../node';
import { log } from '../../utils/log';
import { findNearestNodemodulesFile } from '../../utils/npm-finder';
import { tempPath, testsPath } from '../../utils/structor-config';

export const CommandTest = async (instance: typeof pri) => {
  execSync(
    [
      findNearestNodemodulesFile('/.bin/jest'),
      `--testRegex "/${testsPath.dir}/.*\\.tsx?$"`,
      `
      --transform '${JSON.stringify({
        '^.+\\.tsx?$': 'ts-jest'
      })}'
      `,
      `--moduleFileExtensions ts tsx js jsx`,
      `
      --globals '${JSON.stringify({
        'ts-jest': {
          babelConfig: {
            presets: ['@babel/preset-env']
          }
        }
      })}'
      `,
      `--coverage`
    ]
      .map(each => each.trim())
      .join(' '),
    {
      stdio: 'inherit',
      cwd: instance.projectRootPath
    }
  );

  // Open test html in brower
  log(
    `Open this url to see code coverage: file://${path.join(
      instance.projectRootPath,
      'coverage/lcov-report/index.html'
    )}`
  );

  process.exit(0);
};

export default async (instance: typeof pri) => {
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath.startsWith(testsPath.dir);
  });

  instance.commands.registerCommand({
    name: 'test',
    description: 'Run tests.',
    action: async () => {
      // await instance.project.lint();
      // await instance.project.ensureProjectFiles();
      // await instance.project.checkProjectFiles();
      // await CommandTest(instance);

      // For async register commander, process will be exit automatic.
      process.exit(0);
    }
  });
};
