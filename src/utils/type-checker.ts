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
        "grep -in '@DEBUG' --include *.ts --include *.tsx --include *.js --include *.scss --include *.css $(git diff --cached --name-only --diff-filter=ACM) /dev/null",
        {
          shell: 'bash',
          stdio: [0, 1],
        },
      ).toString('utf8');
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (debugFiles) {
      logFatal('@DEBUG identifier exists, the commit is terminated');
      process.exit(1);
    }
  }

  const tsChangedFilesCnt = +execSync("git diff --cached --numstat --diff-filter=ACM | grep -F '.ts' | wc -l").toString(
    'utf8',
  );
  if (tsChangedFilesCnt) {
    logInfo('Checking TypeScript type, please wait');
    try {
      execSync(`${pri.projectRootPath}/node_modules/.bin/tsc -p . || exit 1`, {
        stdio: [0, 1, 2],
      });
    } catch (e) {
      logFatal('Type checks error!');
      process.exit(1);
    }
    logSuccess('Type checks passed!');
  }
}
