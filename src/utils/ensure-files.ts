import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as yargs from 'yargs';
import { logInfo, logWarn, logFatal } from './log';
import { plugin } from './plugins';
import { priEvent } from './pri-events';

export const ensureFiles = async () => {
  if (yargs.argv.light) {
    return;
  }

  priEvent.emit('beforeEnsureFiles');

  const ensureProjectFilesQueueGroupByPath = _.groupBy(plugin.ensureProjectFilesQueue, 'fileName');

  await Promise.all(
    Object.keys(ensureProjectFilesQueueGroupByPath).map(async filePath => {
      const ensureProjectFilesQueue = ensureProjectFilesQueueGroupByPath[filePath];

      await ensureFile(
        filePath,
        ensureProjectFilesQueue.map(ensureProjectFiles => {
          return ensureProjectFiles.pipeContent;
        })
      );
    })
  );
};

export async function ensureFile(filePath: string, pipeContents: ((prev: string) => string | Promise<string>)[]) {
  if (!path.isAbsolute(filePath)) {
    logFatal(`Plugin error: ensureProjectFiles path need be absolute path, not: ${filePath}`);
  }

  const fileExist = fs.existsSync(filePath);

  let exitFileContent = '';
  try {
    exitFileContent = fs.readFileSync(filePath, 'utf8').toString();
  } catch (error) {
    //
  }

  const nextContent = await pipeContents.reduce(async (preContent, pipeContent) => {
    return Promise.resolve(pipeContent(await preContent));
  }, Promise.resolve(exitFileContent));

  if (fileExist) {
    if (exitFileContent === nextContent) {
      // skipped not log
    } else {
      logWarn(`${filePath} exist, but the content is not correct, has been recovered.`);
    }
  } else {
    logInfo(`${filePath} not exist, created.`);
  }

  fs.outputFileSync(filePath, nextContent);
}
