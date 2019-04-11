import * as fs from 'fs-extra';
import * as path from 'path';
import { globalState } from './global-state';
import * as projectState from './project-state';

export const hasNodeModules = () => {
  return fs.existsSync(path.join(globalState.projectRootPath, 'node_modules'));
};

export const hasNodeModulesModified = () => {
  const key = 'node_modules-modified-time';
  const nextModifiedTime = fs.statSync(path.join(globalState.projectRootPath, 'node_modules')).mtime.toString();

  return hasChanged(key, nextModifiedTime);
};

function hasChanged(key: string, nextValue: string) {
  const previewValue = projectState.get(key);
  if (!previewValue) {
    projectState.set(key, nextValue);
    return true;
  }
  projectState.set(key, nextValue);
  if (previewValue !== nextValue) {
    return true;
  }
  return false;
}
