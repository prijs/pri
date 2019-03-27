import { execSync } from 'child_process';
import * as yargs from 'yargs';
import { logFatal, logInfo } from './log';
import { findNearestNodemodulesFile } from './npm-finder';

export const tslintParam = `--fix './?(src|docs|tests)/**/*.?(ts|tsx)'`;
export const prettierParam = `--write './?(src|docs|tests)/**/*.?(ts|tsx|css|less|scss|sass|md|mdx)'`;

export async function lint(showBreakError = true) {
  if (yargs.argv.light) {
    return;
  }

  logInfo('Lint and format code..');

  const forceTslint = showBreakError ? '' : '--force';

  try {
    execSync(
      `${findNearestNodemodulesFile('.bin/tslint')} ${forceTslint} ${tslintParam} && ${findNearestNodemodulesFile(
        '.bin/prettier'
      )} ${prettierParam}`,
      {
        stdio: 'inherit'
      }
    );
  } catch (error) {
    logFatal(error);
  }

  // Maybe change project files after lint, so `git add` and `git commit` if necessary.
  // TODO:
  // await addCommitIfNecessary('Commit after lint.', globalState.projectRootPath);
}
