import * as colors from 'colors';
import { exec } from '../../utils/exec';
import * as git from '../../utils/git-operate';
import { globalState } from '../../utils/global-state';
import { log } from '../../utils/log';

export default async (gitUri: string) => {
  await git.addAllAndCommitIfWorkingTreeNotClean('Prepare for pri packages add.');

  const result = await exec(`git subtree add --prefix packages/__temp ${gitUri} master`);
  // console.log('result', result);
};
