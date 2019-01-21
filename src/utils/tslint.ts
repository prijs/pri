import { execSync } from 'child_process';
import * as path from 'path';
import { Configuration, Linter } from 'tslint';
import * as yargs from 'yargs';
import { plugin } from '../utils/plugins';
import { tempPath } from '../utils/structor-config';
import { globalState } from './global-state';
import { logFatal, logInfo, logText, logWarn, spinner } from './log';

export async function lint(showBreakError = true) {
  if (yargs.argv['light']) {
    return;
  }

  // await spinner('Lint project', async () => {
  //   const configurationFilename = 'tslint.json';
  //   const lintOptions = {
  //     fix: true,
  //     formatter: 'json'
  //   };
  //   const program = Linter.createProgram('tsconfig.json', globalState.projectRootPath);
  //   const linter = new Linter(lintOptions, program);
  //   const files = Linter.getFileNames(program);

  //   files
  //     .filter(filePath => {
  //       return !filePath.startsWith(path.join(globalState.projectRootPath, tempPath.dir));
  //     })
  //     .filter(filePath => {
  //       if (plugin.lintFilters.some(lintFilter => !lintFilter(filePath))) {
  //         return false;
  //       }

  //       return true;
  //     })
  //     .forEach(filePath => {
  //       const fileContents = program.getSourceFile(filePath).getFullText();
  //       const configuration = Configuration.findConfiguration(configurationFilename, filePath).results;
  //       linter.lint(filePath, fileContents, configuration);
  //     });

  //   const results = linter.getResult();
  //   if (results.errorCount > 0) {
  //     results.failures.forEach(failure => {
  //       const errorPosition = failure.getStartPosition().getLineAndCharacter();
  //       const str = `${failure.getFailure()}\n at: \n ${failure.getFileName()}:${errorPosition.line}:${
  //         errorPosition.character
  //       }`;

  //       if (showBreakError) {
  //         logFatal(str);
  //       } else {
  //         logWarn(str);
  //       }
  //     });
  //   }
  //   if (results.fixes.length > 0) {
  //     logText(`Tslint auto fixed ${results.fixes.length} bugs`);
  //   }
  // });
  logInfo('Format code..');

  execSync(`npm run format`, {
    stdio: 'inherit'
  });
}
