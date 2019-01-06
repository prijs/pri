import * as path from 'path';
import { pri } from '../node';
import { globalState } from './global-state';
import { IWhiteFile } from './plugins';
import { srcPath } from './structor-config';

// For component/plugin/cli, add `src` to white list.
export function addWhiteFilesByProjectType(instance: typeof pri) {
  if (
    globalState.projectType === 'component' ||
    globalState.projectType === 'plugin' ||
    globalState.projectType === 'cli'
  ) {
    const ignoreSrc: IWhiteFile = projectFiles => {
      const relativePath = path.relative(globalState.projectRootPath, projectFiles.dir);
      return relativePath.startsWith(srcPath.dir);
    };
    instance.project.whiteFileRules.add(ignoreSrc);
  }
}
