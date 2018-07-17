import * as colors from 'colors';
import * as gulp from 'gulp';
import { globalState } from '../utils/global-state';
import { log } from '../utils/log';
import { tsPlusBabel } from '../utils/ts-plus-babel';

export default async () => {
  log("Watching plugin's files.");

  const sourceBlob = 'src/**/*.{tsx,ts}';
  const watcher = gulp.watch(sourceBlob);

  await tsPlusBabel(globalState.projectConfig.distDir);

  // TODO: On create delete?
  watcher.on('change', async () => {
    log(colors.blue(`Start rebuild.`));
    await tsPlusBabel(globalState.projectConfig.distDir);
    log(colors.green(`End rebuild.`));
  });
};
