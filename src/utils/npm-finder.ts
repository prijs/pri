import * as colors from 'colors';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './log';

export const findNearestNodemodules = () => {
  return findNearestNodemodulesByPath(__dirname);
};

export const findNearestNodemodulesFile = (tryRelativeFilePath: string) => {
  try {
    const nodemodulePath = findNearestNodemodulesByPath(__dirname, tryRelativeFilePath);
    return path.join(nodemodulePath, tryRelativeFilePath);
  } catch (error) {
    log(colors.red(`${tryRelativeFilePath} not found!`));
    process.exit(0);
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
    } else {
      const tryAbsoluteFilePath = path.join(findPath, tryRelativeFilePath);
      if (fs.existsSync(tryAbsoluteFilePath)) {
        return findPath;
      }
    }
  }

  // Find parent dir
  return findNearestNodemodulesByPath(path.resolve(filePath, '..'), tryRelativeFilePath);
}
