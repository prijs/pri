import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as open from 'opn';
import * as path from 'path';
import { globalState } from '../utils/global-state';
import { log } from '../utils/log';
import { findNearestNodemodulesFile } from '../utils/npm-finder';
import { srcPath, testsPath } from '../utils/structor-config';
import text from '../utils/text';
import { tsPlusBabel } from '../utils/ts-plus-babel';

export default async () => {
  log(`Build typescript files`);
  execSync(`${findNearestNodemodulesFile('/.bin/rimraf')} ${globalState.projectConfig.distDir}`, {
    stdio: 'inherit'
  });

  await tsPlusBabel(globalState.projectConfig.distDir);

  execSync(
    [
      findNearestNodemodulesFile('/.bin/nyc'),
      `--reporter lcov`,
      `--reporter text`,
      `--reporter json`,
      `--exclude ${globalState.projectConfig.distDir}/${testsPath.dir}/**/*.js`,
      `${findNearestNodemodulesFile('/.bin/ava')}`,
      `--files ${path.join(
        globalState.projectRootPath,
        `${globalState.projectConfig.distDir}/${testsPath.dir}/**/*.js`
      )}`,
      `--failFast`
    ].join(' '),
    {
      stdio: 'inherit',
      cwd: globalState.projectRootPath
    }
  );

  // remove .nyc_output
  execSync(`${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(globalState.projectRootPath, '.nyc_output')}`);

  // Open test html in brower
  open(path.join(globalState.projectRootPath, 'coverage/lcov-report/index.html'));
};
