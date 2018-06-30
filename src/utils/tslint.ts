import * as colors from 'colors';
import * as path from 'path';
import { Configuration, Linter } from 'tslint';
import * as yargs from 'yargs';
import { plugin } from '../utils/plugins';
import { tempPath } from '../utils/structor-config';
import { globalState } from './global-state';
import { log, spinner } from './log';

export async function lint(showBreakError = true) {
  if (yargs.argv['light']) {
    return;
  }

  await spinner('Lint project', async () => {
    const configurationFilename = 'tslint.json';
    const lintOptions = {
      fix: true,
      formatter: 'json'
    };
    const program = Linter.createProgram('tsconfig.json', globalState.projectRootPath);
    const linter = new Linter(lintOptions, program);
    const files = Linter.getFileNames(program);

    files
      .filter(filePath => {
        return !filePath.startsWith(path.join(globalState.projectRootPath, tempPath.dir));
      })
      .filter(filePath => {
        if (plugin.lintFilters.some(lintFilter => !lintFilter(filePath))) {
          return false;
        }

        return true;
      })
      .forEach(filePath => {
        const fileContents = program.getSourceFile(filePath).getFullText();
        const configuration = Configuration.findConfiguration(configurationFilename, filePath).results;
        linter.lint(filePath, fileContents, configuration);
      });

    const results = linter.getResult();
    if (results.errorCount > 0) {
      showBreakError ? log(colors.red(`Tslint errors:`)) : log(colors.yellow(`Tslint warnings:`));
      results.failures.forEach(failure => {
        const errorPosition = failure.getStartPosition().getLineAndCharacter();
        log(
          showBreakError ? colors.red(`${failure.getFailure()}`) : colors.yellow(`${failure.getFailure()}`),
          ' at: ',
          `${failure.getFileName()}:${errorPosition.line}:${errorPosition.character}`
        );
      });

      if (showBreakError) {
        process.exit(0);
      }
    }
    if (results.fixes.length > 0) {
      log(`Tslint auto fixed ${results.fixes.length} bugs`);
    }
  });
}
