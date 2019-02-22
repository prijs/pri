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
            presets: [['@babel/preset-env']],
            plugins: [['@babel/plugin-transform-runtime', { regenerator: true }]]
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
      cwd: pri.projectRootPath
    }
  );

  // Open test html in brower
  logText(
    `Open this url to see code coverage: file://${path.join(pri.projectRootPath, 'coverage/lcov-report/index.html')}`
  );

  process.exit(0);
};
