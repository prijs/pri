import * as colors from 'colors';
import * as path from 'path';
import { globalState } from '../../utils/global-state';
import { log } from '../../utils/log';
import { IWhiteFile, plugin } from '../../utils/plugins';
import { ProjectConfig } from '../../utils/project-config-interface';
import { srcPath } from '../../utils/structor-config';
import { walkProjectFiles } from '../../utils/walk-project-files';

export const checkProjectFiles = async () => {
  log('Check project files.\n');
  const files = await walkProjectFiles();

  const whiteFileRules = plugin.whiteFileRules.slice();

  // For component project, add `src` to white list.
  if (globalState.projectType === 'component') {
    const ignoreSrc: IWhiteFile = projectFiles => {
      const relativePath = path.relative(globalState.projectRootPath, projectFiles.dir);
      return relativePath.startsWith(srcPath.dir);
    };
    whiteFileRules.push(ignoreSrc);
  }

  files.forEach(file => {
    if (!whiteFileRules.some(whiteFileRule => whiteFileRule(file))) {
      log(colors.red(`Unexpected file or directory: ${path.format(file)}`));
      process.exit(0);
    }
  });
};
