import * as path from 'path';
import { pri } from '../node';
import { globalState } from './global-state';
import { IWhiteFile } from './plugins';
import { srcPath } from './structor-config';

// For component/plugin/cli, add `src` to white list.
export function addWhiteFilesByProjectType() {
  if (
    globalState.projectPackageJson.pri.type === 'component' ||
    globalState.projectPackageJson.pri.type === 'plugin' ||
    globalState.projectPackageJson.pri.type === 'cli'
  ) {
    const ignoreSrc: IWhiteFile = projectFiles => {
      const relativePath = path.relative(globalState.projectRootPath, projectFiles.dir);
      return relativePath.startsWith(srcPath.dir);
    };
    pri.project.whiteFileRules.add(ignoreSrc);
  }
}
