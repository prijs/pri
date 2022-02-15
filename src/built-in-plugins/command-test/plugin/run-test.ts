import * as path from 'path';
import * as jest from 'jest';
import { pri } from '../../../node';
import { plugin } from '../../../utils/plugins';
import { logText } from '../../../utils/log';
import { testsPath } from '../../../utils/structor-config';
import { globalState } from '../../../utils/global-state';
import { IOpts } from './interface';

export const runTest = async (options: IOpts) => {
  const jestConfig = {
    rootDir: pri.sourceRoot,
    testRegex: options.testRegex ?? `${path.join(pri.sourceRoot, testsPath.dir)}/.*\\.tsx?$`,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    coverage: true,
    updateSnapshot: options.updateSnapshot,
    watch: options.watch,
    watchAll: options.watchAll,
    transform: JSON.stringify({
      [`${pri.sourceRoot}/.*\\.tsx?$`]: path.join(__dirname, './jest-transformer'),
      ...globalState.packages.reduce((obj, eachPackage) => {
        if (eachPackage.rootPath) {
          return {
            ...obj,
            [`${path.join(eachPackage.rootPath, 'src')}/.*\\.tsx?$`]: path.join(__dirname, './jest-transformer'),
          };
        }
        return obj;
      }, {}),
    }),
    moduleNameMapper: JSON.stringify(
      globalState.packages.reduce((obj, eachPackage) => {
        if (eachPackage.packageJson && eachPackage.packageJson.name) {
          return {
            ...obj,
            [`^${eachPackage.packageJson.name}$`]: path.join(eachPackage.rootPath, 'src'),
          };
        }
        return obj;
      }, {}),
    ),
  };

  await jest.runCLI(
    {
      _: options._,
      $0: options.$0,
      ...plugin.jestConfigPipes.reduce((config, fn) => fn(config), jestConfig),
    },
    [pri.projectRootPath],
  );

  logText(
    `Open this url to see code coverage: file://${path.join(pri.projectRootPath, 'coverage/lcov-report/index.html')}`,
  );

  process.exit(0);
};
