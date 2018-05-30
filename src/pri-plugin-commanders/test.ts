import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as open from 'opn';
import * as path from 'path';
import { log } from '../utils/log';
import { findNearestNodemodulesFile } from '../utils/npm-finder';
import { srcPath, testsPath, tsBuiltPath } from '../utils/structor-config';
import text from '../utils/text';
import { tsPlusBabel } from '../utils/ts-plus-babel';

export default async (projectRootPath: string) => {
  log(`Build typescript files`);
  execSync(`${findNearestNodemodulesFile('/.bin/rimraf')} ${tsBuiltPath.dir}`, {
    stdio: 'inherit'
  });

  await tsPlusBabel(projectRootPath, tsBuiltPath.dir);

  execSync(
    [
      findNearestNodemodulesFile('/.bin/nyc'),
      `--reporter lcov`,
      `--reporter text`,
      `--reporter json`,
      `--exclude ${tsBuiltPath.dir}/${testsPath.dir}/**/*.js`,
      `${findNearestNodemodulesFile('/.bin/ava')}`,
      `--files ${path.join(projectRootPath, `${tsBuiltPath.dir}/${testsPath.dir}/**/*.js`)}`,
      `--failFast`
    ].join(' '),
    {
      stdio: 'inherit',
      cwd: projectRootPath
    }
  );

  // remove .nyc_output
  execSync(`${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(projectRootPath, '.nyc_output')}`);

  // Open test html in brower
  open(path.join(projectRootPath, 'coverage/lcov-report/index.html'));
};
