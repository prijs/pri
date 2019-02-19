import { execSync } from 'child_process';
import * as yargs from 'yargs';
import { logInfo } from './log';
import { findNearestNodemodulesFile } from './npm-finder';

export async function lint(showBreakError = true) {
  if (yargs.argv['light']) {
    return;
  }

  logInfo('Lint and format code..');

  const forceTslint = showBreakError ? '' : '--force';

  execSync(
    `${findNearestNodemodulesFile(
      '.bin/tslint'
    )} ${forceTslint} --fix './src/**/*.?(ts|tsx)' && ${findNearestNodemodulesFile(
      '.bin/prettier'
    )} --write './src/**/*.?(ts|tsx|css|less|scss|sass|md|mdx)'`,
    {
      stdio: 'inherit'
    }
  );
}
