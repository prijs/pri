import { pri } from '../../../node';
import { cleanDist } from '../../../utils/clean';
import { spinner, logInfo } from '../../../utils/log';
import { tsPlusBabel } from '../../../utils/ts-plus-babel';

export const pluginDev = async () => {
  // Because plugin need create files, so clear dist first.
  await cleanDist();

  await spinner('Analyse project', async () => {
    await pri.project.ensureProjectFiles();
    await pri.project.checkProjectFiles();
  });

  // Build all
  await spinner(`Init build`, async () => {
    await tsPlusBabel(false, true);
  });
  // Watch
  logInfo('Watching files..');
  await tsPlusBabel(true, true);
};
