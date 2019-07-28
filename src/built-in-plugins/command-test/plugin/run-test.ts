import { execSync } from 'child_process';
import * as path from 'path';
import { pri } from '../../../node';
import { logText } from '../../../utils/log';
import { findNearestNodemodulesFile } from '../../../utils/npm-finder';
import { testsPath } from '../../../utils/structor-config';

export const runTest = async () => {
  execSync(
    [
      findNearestNodemodulesFile('/.bin/jest'),
      `--testRegex "${path.join(pri.sourceRoot, testsPath.dir)}/.*\\.tsx?$"`,
      '--moduleFileExtensions ts tsx js jsx',
      '--coverage',
    ]
      .map(each => {
        return each.trim();
      })
      .join(' '),
    {
      stdio: 'inherit',
      cwd: pri.projectRootPath,
    },
  );

  // Open test html in brower
  logText(
    `Open this url to see code coverage: file://${path.join(pri.projectRootPath, 'coverage/lcov-report/index.html')}`,
  );

  process.exit(0);
};
