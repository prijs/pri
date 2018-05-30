import * as colors from 'colors';
import * as path from 'path';
import { Configuration, Linter } from 'tslint';
import { plugin } from '../utils/plugins';
import { tempPath } from '../utils/structor-config';
import { log, spinner } from './log';
import { findNearestNodemodulesFile } from './npm-finder';

export async function lint(projectRootPath: string) {
  const configurationFilename = 'tslint.json';
  const lintOptions = {
    fix: true,
    formatter: 'json'
  };
  const program = Linter.createProgram('tsconfig.json', projectRootPath);
  const linter = new Linter(lintOptions, program);
  const files = Linter.getFileNames(program);

  files
    .filter(filePath => {
      return !filePath.startsWith(path.join(projectRootPath, tempPath.dir));
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
    log(colors.red(`Tslint errors:`));
    results.failures.forEach(failure => {
      const errorPosition = failure.getStartPosition().getLineAndCharacter();
      log(
        colors.red(`${failure.getFailure()}`),
        ', at: ',
        `${failure.getFileName()}:${errorPosition.line}:${errorPosition.character}`
      );
    });
    process.exit(0);
  }
  if (results.fixes.length > 0) {
    log(`Tslint auto fixed ${results.fixes.length} bugs`);
  }
}
