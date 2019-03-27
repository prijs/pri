import * as fs from 'fs';
import * as path from 'path';
import { logFatal } from './log';

export const findNearestNodemodules = () => {
  return findNearestNodemodulesByPath(__dirname);
};

export const findNearestNodemodulesFile = (tryRelativeFilePath: string) => {
  try {
    const nodemodulePath = findNearestNodemodulesByPath(__dirname, tryRelativeFilePath);
    return path.join(nodemodulePath, tryRelativeFilePath);
  } catch (error) {
    logFatal(`${tryRelativeFilePath} not found!`);
  }
};

function findNearestNodemodulesByPath(filePath: string, tryRelativeFilePath?: string): string {
  if (filePath === '/') {
    throw Error('Not found');
  }

  const findPath = path.join(filePath, 'node_modules');

  if (fs.existsSync(findPath)) {
    if (!tryRelativeFilePath) {
      return findPath;
    }
    const tryAbsoluteFilePath = path.join(findPath, tryRelativeFilePath);
    if (fs.existsSync(tryAbsoluteFilePath)) {
      return findPath;
    }
  }

  // Find parent dir
  return findNearestNodemodulesByPath(path.resolve(filePath, '..'), tryRelativeFilePath);
}
