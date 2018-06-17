import * as colors from 'colors';
import { FILE } from 'dns';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as walk from 'walk';
import { globalState } from './global-state';
import { log, spinner } from './log';
import { plugin } from './plugins';
import { declarePath, pagesPath, tempPath, tsBuiltPath } from './structor-config';
import { walkProjectFiles } from './walk-project-files';

export const ensureFiles = async () => {
  const ensureProjectFilesQueueGroupByPath = _.groupBy(plugin.ensureProjectFilesQueue, 'fileName');

  Object.keys(ensureProjectFilesQueueGroupByPath).forEach(fileRelativePath => {
    const ensureProjectFilesQueue = ensureProjectFilesQueueGroupByPath[fileRelativePath];

    ensureFile(fileRelativePath, ensureProjectFilesQueue.map(ensureProjectFiles => ensureProjectFiles.pipeContent));
  });
};

export function ensureFile(fileRelativePath: string, pipeContents: Array<((prev: string) => string)>) {
  const filePath = path.join(globalState.projectRootPath, fileRelativePath);
  const fileExist = fs.existsSync(filePath);

  let exitFileContent = '';
  try {
    exitFileContent = fs.readFileSync(filePath, 'utf8').toString();
  } catch (error) {
    //
  }

  const nextContent = pipeContents.reduce((preContent, pipeContent) => pipeContent(preContent), exitFileContent);

  if (fileExist) {
    if (exitFileContent === nextContent) {
      // skipped not log
    } else {
      log(`${colors.yellow(`✔ ${fileRelativePath} exist, but the content is not correct, has been recovered.`)}`);
    }
  } else {
    log(`${colors.magenta(`⚠ ${fileRelativePath} not exist, created.`)}`);
  }

  fs.outputFileSync(filePath, nextContent);
}
