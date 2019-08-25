/* eslint-disable no-console */
import { execSync } from 'child_process';
import * as colors from 'colors';
import * as _ from 'lodash';
import * as path from 'path';
import * as glob from 'glob';
import * as fs from 'fs-extra';
import { logInfo, spinner } from './log';
import { globalState } from './global-state';
import { srcPath, packagesPath } from './structor-config';

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
  const { CLIEngine } = await import('eslint');
  const lintRules = fs.readJsonSync(path.join(globalState.projectRootPath, '.eslintrc'));
  const mergedOptions = _.defaults(options || {}, new DefaultOptions());
  const cli = new CLIEngine({ ...(lintRules as any), fix: mergedOptions.needFix });
  let lintFiles: string[] = [];

  if (mergedOptions.lintAll) {
    lintFiles = glob.sync(`${globalState.projectRootPath}/{${srcPath.dir},${packagesPath.dir}}/**/*.{ts,tsx}`);
  } else {
    lintFiles = _.compact(
      execSync('git diff --cached --name-only --diff-filter=ACM')
        .toString()
        .split('\n'),
    )
      .filter(file => {
        return file.match(/^(src|packages).+(ts|tsx)$/);
      })
      .map(file => {
        return path.join(globalState.projectRootPath, file);
      });
  }

  const lintResult = await spinner(
    `Lint ${mergedOptions.lintAll ? 'all' : ''} ${lintFiles.length} files.`,
    async () => {
      return cli.executeOnFiles(lintFiles);
    },
  );

  const summaryText = [
    `${lintResult.errorCount + lintResult.warningCount} problems (${lintResult.errorCount} errors, ${
      lintResult.warningCount
    } warnings)`,
    `${lintResult.fixableErrorCount} error and ${lintResult.fixableWarningCount} warnings potentially fixable.`,
  ].join('\n');

  if (mergedOptions.needFix) {
    CLIEngine.outputFixes(lintResult);
  }

  if (lintResult.errorCount > 0) {
    if (lintResult.warningCount > 0) {
      console.log('');
      console.log(colors.yellow('Warnings:'));
      console.log('');
    }

    // Warnings
    lintResult.results
      .filter(eachMessage => eachMessage.warningCount > 0)
      .forEach(eachLintResult => {
        eachLintResult.messages
          .filter(eachMessage => eachMessage.severity === 1)
          .forEach(eachMessage => {
            const colorText = colors.yellow('warning');
            console.log(colors.underline(`${eachLintResult.filePath}:${eachMessage.line}:${eachMessage.column}`));
            console.log(`  ${colorText}  ${eachMessage.message}  ${colors.grey(eachMessage.ruleId)}`);
          });
      });

    if (lintResult.errorCount > 0) {
      console.log('');
      console.log(colors.red('Errors:'));
      console.log('');
    }

    // Errors
    lintResult.results
      .filter(eachMessage => eachMessage.errorCount > 0)
      .forEach(eachLintResult => {
        eachLintResult.messages
          .filter(eachMessage => eachMessage.severity === 2)
          .forEach(eachMessage => {
            const colorText = mergedOptions.showBreakError ? colors.red('error') : colors.yellow('error');
            console.log(colors.underline(`${eachLintResult.filePath}:${eachMessage.line}:${eachMessage.column}`));
            console.log(`  ${colorText}  ${eachMessage.message}  ${colors.grey(eachMessage.ruleId)}`);
          });
      });

    if (mergedOptions.showBreakError) {
      console.log(`\n${colors.red(summaryText)}`);
    } else {
      console.log(`\n${colors.yellow(summaryText)}`);
    }

    if (mergedOptions.showBreakError) {
      process.exit(1);
    }
  }

  if (mergedOptions.needFix && lintResult.results.some(each => each.output)) {
    console.log(
      colors.yellow(
        `${lintResult.results.filter(each => each.output).length} files autofixed, please recheck your code.`,
      ),
    );
    process.exit(1);
  }
}
