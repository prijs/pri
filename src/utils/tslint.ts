import { execSync } from 'child_process';
import * as yargs from 'yargs';
import { logFatal, logInfo } from './log';
import { findNearestNodemodulesFile } from './npm-finder';

export async function lint(showBreakError = true) {
  if (yargs.argv['light']) {
    return;
  }

  logInfo('Lint and format code..');

  const forceTslint = showBreakError ? '' : '--force';

  try {
    execSync(
      `${findNearestNodemodulesFile(
        '.bin/tslint'
      )} ${forceTslint} --fix './?(src|docs|tests)/**/*.?(ts|tsx)' && ${findNearestNodemodulesFile(
        '.bin/prettier'
      )} --write './?(src|docs|tests)/**/*.?(ts|tsx|css|less|scss|sass|md|mdx)'`,
      {
        stdio: 'inherit'
      }
    );
  } catch (error) {
    logFatal(error);
  }
}
