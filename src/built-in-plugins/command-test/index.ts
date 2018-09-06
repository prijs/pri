import { execSync } from 'child_process';
import * as path from 'path';
import { pri } from '../../node';
import { log } from '../../utils/log';
import { findNearestNodemodulesFile } from '../../utils/npm-finder';
import { tempPath, testsPath } from '../../utils/structor-config';

export const CommandTest = async (instance: typeof pri) => {
  execSync(
    [
      findNearestNodemodulesFile('/.bin/nyc'),
      `--reporter lcov`,
      `--reporter text`,
      `--reporter json`,
      `--exclude ${testsPath.dir}/**/*.ts`,
      `${findNearestNodemodulesFile('/.bin/ava')}`,
      `--files ${path.join(instance.projectRootPath, `${testsPath.dir}/**/*.ts`)}`,
      `--fail-fast`
    ].join(' '),
    {
      stdio: 'inherit',
      cwd: instance.projectRootPath
    }
  );

  // remove .nyc_output
  execSync(`${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(instance.projectRootPath, '.nyc_output')}`);

  // Open test html in brower
  log(
    `Open this url to see code coverage: file:///${path.join(
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
      await instance.project.lint();
      await instance.project.ensureProjectFiles();
      await instance.project.checkProjectFiles();
      await CommandTest(instance);

      // For async register commander, process will be exit automatic.
      process.exit(0);
    }
  });
};
