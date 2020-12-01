import * as fetch from 'isomorphic-fetch';
import { exec } from './exec';
import { globalState } from './global-state';

const npmWebSite = 'http://web.npm.alibaba-inc.com/package';

export async function isExist(packageName: string) {
  try {
    const result = await fetch(`${npmWebSite}/${packageName}`);
    if (result.status === 404) {
      return false;
    }
    return true;
  } catch (error) {
    throw Error('获取 tnpm 状态失败');
  }
}

export async function getOwners(packageName: string, npmClient?: string) {
  let ownerStr = '';

  try {
    ownerStr = await exec(`${npmClient || globalState.sourceConfig.npmClient} owner ls ${packageName}`);
  } catch (error) {
    ownerStr = '';
  }
  return ownerStr.split('\n').filter(owner => owner !== '');
}

export async function isOwner(userName: string, packageName: string, npmClient?: string) {
  const npmIsExist = await isExist(packageName);
  if (!npmIsExist) {
    return true;
  }

  const npmOwners = await getOwners(packageName, npmClient);
  if (
    !npmOwners.some(eachOwner => {
      return eachOwner.indexOf(userName) > -1;
    })
  ) {
    return false;
  }

  return true;
}
