import { fstat } from 'fs';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as walk from 'walk';
import { globalState } from './global-state';
import {
  declarePath,
  gitIgnores as gitIgnoreNames,
  ignoreScanFiles,
  pagesPath,
  tempPath,
  tsBuiltPath
} from './structor-config';

type WalkStats = fs.Stats & {
  name: string;
};

type ICustomParsedPath = path.ParsedPath & { isDir: boolean };

export function walkProjectFiles(): Promise<ICustomParsedPath[]> {
  return new Promise((resolve, reject) => {
    const gitIgnores = gitIgnoreNames.map(dir => path.join(globalState.projectRootPath, dir));
    const scanIgnores = ignoreScanFiles.map(addon => path.join(globalState.projectRootPath, addon));

    const walker = walk.walk(globalState.projectRootPath, { filters: [...gitIgnores, ...scanIgnores] });

    const files: ICustomParsedPath[] = [];

    walker.on('directories', (root: string, dirStatsArray: WalkStats[], next: () => void) => {
      dirStatsArray.forEach(dirStats => {
        const dirPath = path.join(root, dirStats.name);

        if (dirPath === globalState.projectRootPath) {
          // Skip project's root.
          next();
          return;
        }

        files.push({ isDir: true, ...path.parse(dirPath) });
        next();
      });
    });

    walker.on('file', (root: string, fileStats: WalkStats, next: () => void) => {
      if (gitIgnores.concat(scanIgnores).some(ignorePath => ignorePath === path.join(root, fileStats.name))) {
        next();
        return;
      }

      files.push({ isDir: false, ...path.parse(path.join(root, fileStats.name)) });
      next();
    });

    walker.on('errors', (root: string, nodeStatsArray: WalkStats, next: () => void) => {
      next();
    });

    walker.on('end', () => {
      resolve(files);
    });
  });
}
