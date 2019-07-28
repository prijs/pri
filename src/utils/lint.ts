import { execSync } from 'child_process';
import * as yargs from 'yargs';
import * as _ from 'lodash';
import { logInfo } from './log';
import { findNearestNodemodulesFile } from './npm-finder';
import { globalState } from './global-state';

export const eslintParam = "'./?(src|packages|docs|tests)/**/*.?(ts|tsx)'";

interface Options {
  lintAll?: boolean;
  needFix?: boolean;
  showBreakError?: boolean;
}

class DefaultOptions {
  lintAll = false;

  needFix = true;

  showBreakError = true;
}

export async function lint(options?: Partial<DefaultOptions>) {
  const mergedOptions = _.defaults(options || {}, new DefaultOptions());

  if (yargs.argv.light) {
    return;
  }

  try {
    if (!mergedOptions.lintAll && globalState.projectConfig.incrementalLint === true) {
      lintIncrement(mergedOptions);
    } else {
      lintAll(mergedOptions);
    }
  } catch (error) {
    if (mergedOptions.showBreakError) {
      process.exit(1);
    } else {
      // Ignore
    }
  }
}

function lintAll(options: DefaultOptions) {
  logInfo('\nLint all files..');

  const eslintCmd = findNearestNodemodulesFile('.bin/eslint');
  const script = options.needFix ? `${eslintCmd} --fix ${eslintParam}` : `${eslintCmd} ${eslintParam}`;
  execSync(script, { stdio: 'inherit' });
}

function lintIncrement(options: DefaultOptions) {
  const eslintCmd = findNearestNodemodulesFile('.bin/eslint');
  const commitedFiles = _.compact(
    execSync('git diff --cached --name-only --diff-filter=ACM')
      .toString()
      .split('\n'),
  ).filter(file => {
    return file.match(/^(src|packages|docs|tests).+(ts|tsx)$/);
  });

  if (commitedFiles.length > 0) {
    logInfo(`\nLint ${commitedFiles.length} files..`);

    const script = options.needFix
      ? [`${eslintCmd} --fix`, ...commitedFiles].join(' ')
      : [`${eslintCmd}`, ...commitedFiles].join(' ');
    execSync(script, { stdio: 'inherit' });
  }
}
