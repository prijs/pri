import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as process from 'process';
import { logFatal, logInfo, logSuccess } from '../../../utils/log';

const shScript = `
  #!/bin/bash

  # author: 奇阳
  # 类型校验

  # 检查代码中是否包含 @DEBUG 标识符
  if [ "$(git diff --cached --numstat --diff-filter=ACM | wc -l)" -gt 0 ]
  then
    FILES=$(grep -in '@DEBUG' --include *.ts --include *.tsx --include *.js --include *.scss --include *.css $(git diff --cached --name-only --diff-filter=ACM) /dev/null)
    if [ -n "$FILES" ]
    then
      echo '\033[33m待提交代码中存在 @DEBUG 标识符，提交终止'
      echo $FILES
      exit 1
    fi
  fi

  # 对整个项目进行完整的类型检查
  TS_CHANGED=$(git diff --cached --numstat --diff-filter=ACM | grep -F '.ts' | wc -l)
  if [ "$TS_CHANGED" -gt 0 ]
  then
    echo '正在检查 TypeScript 类型，请稍候'
    tsc -p . --noEmit || exit 1
  fi
`;

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
      execSync(`tsc -p . --noEmit || exit 1`, {
        stdio: [0, 1, 2],
      });
    } catch (e) {
      logFatal('类型检查出错！');
      process.exit(1);
    }
    logSuccess('所有代码类型检查通过！');
  }
}
