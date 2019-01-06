import * as path from 'path';
import * as yargs from 'yargs';
import { globalState } from '../../utils/global-state';
import { logFatal, logText } from '../../utils/log';
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

  files.forEach(file => {
    if (!whiteFileRules.some(whiteFileRule => whiteFileRule(file))) {
      logFatal(`Unexpected file or directory: ${path.format(file)}`);
    }
  });
};
