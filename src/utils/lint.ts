import { execSync } from 'child_process';
import * as yargs from 'yargs';
import { logInfo } from './log';
import { findNearestNodemodulesFile } from './npm-finder';

export const eslintParam = "--fix './?(src|packages|docs|tests)/**/*.?(ts|tsx)'";

export async function lint(showBreakError = true) {
  if (yargs.argv.light) {
    return;
  }

  logInfo('\nLint and format code..');

  try {
    execSync([`${findNearestNodemodulesFile('.bin/eslint')} ${eslintParam}`].join(' '), {
      stdio: 'inherit'
    });
  } catch (error) {
    if (showBreakError) {
      process.exit(1);
    } else {
      // Ignore
    }
  }

  // Maybe change project files after lint, so `git add` and `git commit` if necessary.
  // TODO:
  // await addCommitIfNecessary('Commit after lint.', globalState.projectRootPath);
}
