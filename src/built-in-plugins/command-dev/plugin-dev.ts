import * as gulp from 'gulp';
import { globalState } from '../../utils/global-state';
import { logAwait, logComplete, logText } from '../../utils/log';
import { tsPlusBabel } from '../../utils/ts-plus-babel';

export const pluginDev = async () => {
  logText("Watching plugin's files.");

  const sourceBlob = 'src/**/*.{tsx,ts}';
  const watcher = gulp.watch(sourceBlob);

  await tsPlusBabel(globalState.projectConfig.distDir);

  // TODO: On create delete?
  watcher.on('change', async () => {
    logAwait(`Start rebuild.`);
    await tsPlusBabel(globalState.projectConfig.distDir);
    logComplete(`End rebuild.`);
  });
};
