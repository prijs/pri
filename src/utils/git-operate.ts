import * as colors from 'colors';
import * as semver from 'semver';
import { exec } from './exec';
import { log } from './log';

let hasCheckGitVersion = false;
const gitVersionWarning: string = null;

export const checkGitVersion = async (cwd?: string) => {
  if (hasCheckGitVersion) {
    return validateGitVersion();
  }

  hasCheckGitVersion = true;

  const gitVersion = await exec(`git --version`, { cwd });

  try {
    const gitVersionPorcelain = /git\s+version\s+([0-9.]+)/g.exec(gitVersion)[1];
    if (semver.lte(gitVersionPorcelain, '2.14.0')) {
      // tslint:disable-next-line:no-console
      log(
        colors.red(
          `Your git version is outdate, should upgrade to 2.14.1 and above, current version: ${gitVersionPorcelain}`
        )
      );
      process.exit(0);
    }
  } catch {}

  validateGitVersion();
};

function validateGitVersion() {
  if (gitVersionWarning === null) {
    return;
  } else {
    log(colors.red(gitVersionWarning));
    process.exit(0);
  }
}

export const getStatus = async (cwd?: string) => {
  await checkGitVersion(cwd);

  const gitStatus = await exec(`git status --porcelain`, { cwd });

  return gitStatus;
};

export const isWorkingTreeClean = async (cwd?: string) => {
  const status = await getStatus(cwd);
  if (status === '') {
    return true;
  }
  return false;
};

export const addAllAndCommit = async (message: string, cwd?: string) => {
  try {
    await exec(`git add -A; git commit -m "${message}"`, { cwd });
  } catch {}
};

export const addAllAndCommitIfWorkingTreeNotClean = async (message: string, cwd?: string) => {
  if (!(await isWorkingTreeClean(cwd))) {
    log(colors.yellow(`Working tree is not clean, auto add all and commit: "${message}"`));
    try {
      await addAllAndCommit(message, cwd);
    } catch {
      // Ignore
    }
  }
};
