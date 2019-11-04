import { execSync } from 'child_process';
import * as colors from 'colors';
import * as _ from 'lodash';
import * as path from 'path';
import * as glob from 'glob';
import * as fs from 'fs-extra';
import { spinner } from './log';
import { globalState } from './global-state';
import { srcPath, packagesPath } from './structor-config';
import { typeChecker } from './type-checker';

export const eslintParam = "'./?(src|packages|docs|tests)/**/*.?(ts|tsx)'";

interface Options {
  lintAll?: boolean;
  needFix?: boolean;
  showBreakError?: boolean;
  typeCheck?: boolean;
}

class DefaultOptions {
  lintAll = false;

  needFix = true;

  showBreakError = true;

  typeCheck = false;
}

export async function lint(options?: Partial<DefaultOptions>) {
  const { CLIEngine } = await import('eslint');
  const lintRules = fs.readJsonSync(path.join(globalState.projectRootPath, '.eslintrc'));
  const mergedOptions = _.defaults(options || {}, new DefaultOptions());
  const eslintIgnorePath = path.join(globalState.projectRootPath, '.eslintignore');
  const eslintIgnoreExist = fs.existsSync(eslintIgnorePath);

  const cli = new CLIEngine({
    ...(lintRules as any),
    fix: mergedOptions.needFix,
    ignore: true,
    ignorePath: eslintIgnoreExist ? eslintIgnorePath : null,
    // TODO: 临时加进来，@琳峰 记得改造
    globals: ['API', 'defs'],
  });

  let lintFiles: string[] = [];
  let prettierFiles: string[] = [];

  if (mergedOptions.lintAll) {
    if (globalState.selectedSourceType === 'root') {
      lintFiles = glob.sync(`${globalState.projectRootPath}/{${srcPath.dir},${packagesPath.dir}}/**/*.{ts,tsx}`);
    } else {
      lintFiles = glob.sync(
        `${globalState.projectRootPath}/${packagesPath.dir}/${globalState.selectedSourceType}/**/*.{ts,tsx}`,
      );
    }
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

  lintFiles = lintFiles.filter(file => !cli.isPathIgnored(file));

  const lintResult = await spinner(
    `Lint ${mergedOptions.lintAll ? 'all' : ''} ${lintFiles.length} files.`,
    async () => {
      const files = execSync(`npx prettier --list-different --write ${lintFiles.join(' ')}`);
      prettierFiles = _.compact(files.toString().split('\n'));
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
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(colors.yellow('Warnings:'));
      // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
            console.log(colors.underline(`${eachLintResult.filePath}:${eachMessage.line}:${eachMessage.column}`));
            // eslint-disable-next-line no-console
            console.log(`  ${colorText}  ${eachMessage.message}  ${colors.grey(eachMessage.ruleId)}`);
          });
      });

    if (lintResult.errorCount > 0) {
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(colors.red('Errors:'));
      // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
            console.log(colors.underline(`${eachLintResult.filePath}:${eachMessage.line}:${eachMessage.column}`));
            // eslint-disable-next-line no-console
            console.log(`  ${colorText}  ${eachMessage.message}  ${colors.grey(eachMessage.ruleId)}`);
          });
      });

    if (mergedOptions.showBreakError) {
      // eslint-disable-next-line no-console
      console.log(`\n${colors.red(summaryText)}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`\n${colors.yellow(summaryText)}`);
    }

    if (mergedOptions.showBreakError) {
      process.exit(1);
    }
  }

  if (mergedOptions.needFix && (lintResult.results.some(each => each.output) || prettierFiles.length > 0)) {
    const fixedFilePaths = _.uniq(
      lintResult.results
        .filter(each => each.output)
        .map(item => item.filePath)
        .concat(prettierFiles),
    );

    // eslint-disable-next-line no-console
    console.log(colors.yellow(`${fixedFilePaths.length} files autofixed, please recheck your code.`));
    execSync(`git add ${fixedFilePaths.join(' ')}`);
  }

  if (mergedOptions.typeCheck) {
    typeChecker();
    process.exit(1);
  }
}
