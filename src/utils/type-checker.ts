import { execSync } from 'child_process';
import * as process from 'process';
import { pri } from '../node';
import { logFatal, logInfo, logSuccess } from './log';

export function typeChecker() {
  const stashFileCnt = +execSync('git diff --cached --numstat --diff-filter=ACM | wc -l').toString('utf8');

  if (stashFileCnt > 0) {
    let debugFiles = '';

    try {
      debugFiles = execSync(
        `grep -in '@DEBUG' --include *.ts --include *.tsx --include *.js --include *.scss --include *.css $(git diff --cached --name-only --diff-filter=ACM) /dev/null`,
        {
          shell: 'bash',
          stdio: [0, 1],
        },
      ).toString('utf8');
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (debugFiles) {
      logFatal('待提交代码中存在 @DEBUG 标识符，提交终止');
      process.exit(1);
    }
  }

  const tsChangedFilesCnt = +execSync(`git diff --cached --numstat --diff-filter=ACM | grep -F '.ts' | wc -l`).toString(
    'utf8',
  );
  if (tsChangedFilesCnt) {
    logInfo('正在检查 Typescript 类型，请稍后');
    try {
      execSync(`${pri.projectRootPath}/node_modules/.bin/tsc -p . || exit 1`, {
        stdio: [0, 1, 2],
      });
    } catch (e) {
      logFatal('类型检查出错！');
      process.exit(1);
    }
    logSuccess('所有代码类型检查通过！');
  }
}
