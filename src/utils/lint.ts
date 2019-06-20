import { execSync } from 'child_process';
import * as yargs from 'yargs';
import * as _ from 'lodash';
import { logInfo } from './log';
import { findNearestNodemodulesFile } from './npm-finder';

export const eslintParam = "'./?(src|packages|docs|tests)/**/*.?(ts|tsx)'";

export async function lint(
  options = {
    lintAll: false,
    needFix: true,
    showBreakError: true
  }
) {
  if (yargs.argv.light) {
    return;
  }

  logInfo('\nLint and format code..');

  try {
    const eslintCmd = findNearestNodemodulesFile('.bin/eslint');

    if (options.lintAll) {
      const script = options.needFix ? `${eslintCmd} --fix ${eslintParam}` : `${eslintCmd} ${eslintParam}`;
      execSync(script, { stdio: 'inherit' });
    } else {
      const commitedFiles = _.compact(
        execSync('git diff --cached --name-only --diff-filter=ACM')
          .toString()
          .split('\n')
      ).filter(file => {
        return file.match(/^(src|packages|docs|tests).+(ts|tsx)$/);
      });

      if (commitedFiles.length > 0) {
        const script = options.needFix
          ? [`${eslintCmd} --fix`, ...commitedFiles].join(' ')
          : [`${eslintCmd}`, ...commitedFiles].join(' ');
        execSync(script, { stdio: 'inherit' });
      }
    }
  } catch (error) {
    if (options.showBreakError) {
      process.exit(1);
    } else {
      // Ignore
    }
  }
}
