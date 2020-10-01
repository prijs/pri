import { execSync } from 'child_process';
import * as path from 'path';
import { pri } from '../../../node';
import { logText } from '../../../utils/log';
import { findNearestNodemodulesFile } from '../../../utils/npm-finder';
import { testsPath } from '../../../utils/structor-config';
import { globalState } from '../../../utils/global-state';

export const runTest = async () => {
  execSync(
    [
      findNearestNodemodulesFile('/.bin/jest'),
      `--roots "${pri.sourceRoot}"`,
      `--testRegex "${path.join(pri.sourceRoot, testsPath.dir)}/.*\\.tsx?$"`,
      '--moduleFileExtensions ts tsx js jsx',
      `--transform '${JSON.stringify({
        [`${pri.sourceRoot}/.*\\.tsx?$`]: path.join(__dirname, './jest-transformer'),
      })}'`,
      // `--setupFilesAfterEnv '${path.join(__dirname, './jest-setup')}'`,
      '--coverage',
      // 测试支持自定义 packages 别名
      `--moduleNameMapper '${JSON.stringify(
        globalState.packages.reduce((obj, eachPackage) => {
          if (eachPackage.packageJson && eachPackage.packageJson.name) {
            return {
              ...obj,
              [eachPackage.packageJson.name]: path.join(eachPackage.rootPath, 'src'),
            };
          }
          return obj;
        }, {}),
      )}'`,
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

  logText(
    `Open this url to see code coverage: file://${path.join(pri.projectRootPath, 'coverage/lcov-report/index.html')}`,
  );

  process.exit(0);
};
