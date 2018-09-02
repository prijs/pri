import * as colors from 'colors';
import * as path from 'path';
import * as yargs from 'yargs';
import { globalState } from '../../utils/global-state';
import { log } from '../../utils/log';
import { IWhiteFile, plugin } from '../../utils/plugins';
import { srcPath } from '../../utils/structor-config';
import { walkProjectFiles } from '../../utils/walk-project-files';

export const checkProjectFiles = async () => {
  if (yargs.argv['light']) {
    return;
  }

  if (!globalState.projectConfig.unexpectedFileCheck) {
    return;
  }

  const files = await walkProjectFiles();

  const whiteFileRules = plugin.whiteFileRules.slice();

  // For component/plugin, add `src` to white list.
  if (globalState.projectType === 'component' || globalState.projectType === 'plugin') {
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
