import * as colors from 'colors';
import * as semver from 'semver';
import { exec } from './exec';
import { log } from './log';

let hasCheckGitVersion = false;
const gitVersionWarning: string = null;

export const checkGitVersion = async () => {
  if (hasCheckGitVersion) {
    return validateGitVersion();
  }

  hasCheckGitVersion = true;

  const gitVersion = await exec(`git --version`);

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

export const getStatus = async () => {
  await checkGitVersion();

  const gitStatus = await exec(`git status --porcelain`);

  return gitStatus;
};

export const isWorkingTreeClean = async () => {
  const status = await getStatus();
  if (status === '') {
    return true;
  }
  return false;
};

export const addAllAndCommit = async (message: string) => {
  await exec(`git add -A; git commit -m "${message}"`);
};

export const addAllAndCommitIfWorkingTreeNotClean = async (message: string) => {
  if (!(await isWorkingTreeClean())) {
    log(colors.yellow(`Working tree is not clean, auto add all and commit: "${message}"`));
    await addAllAndCommit(message);
  }
};
