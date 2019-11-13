import * as semver from 'semver';
import { exec } from './exec';
import { logFatal } from './log';

let hasCheckGitVersion = false;
const gitVersionWarning: string = null;

export const checkGitVersion = async (cwd?: string) => {
  if (hasCheckGitVersion) {
    return validateGitVersion();
  }

  hasCheckGitVersion = true;

  const gitVersion = await exec('git --version', { cwd });

  try {
    const gitVersionPorcelain = /git\s+version\s+([0-9.]+)/g.exec(gitVersion)[1];
    if (semver.lte(gitVersionPorcelain, '2.14.0')) {
      logFatal(
        `Your git version is outdate, should upgrade to 2.14.1 and above, current version: ${gitVersionPorcelain}`,
      );
    }
  } catch {
    //
  }

  validateGitVersion();
};

function validateGitVersion() {
  if (gitVersionWarning === null) {
    //
  } else {
    logFatal(gitVersionWarning);
  }
}

export const getStatus = async (cwd?: string) => {
  await checkGitVersion(cwd);

  const gitStatus = await exec('git status --porcelain', { cwd });

  return gitStatus;
};

export const isWorkingTreeClean = async (cwd?: string) => {
  const status = await getStatus(cwd);
  if (status.trim() === '') {
    return true;
  }
  return false;
};

export const getCurrentBranchName = async (cwd?: string) => {
  const branchName = await exec('git rev-parse --abbrev-ref HEAD 2>/dev/null', { cwd });
  return branchName;
};
