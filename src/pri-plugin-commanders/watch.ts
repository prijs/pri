import * as colors from 'colors';
import * as gulp from 'gulp';
import { globalState } from '../utils/global-state';
import { log } from '../utils/log';
import { tsBuiltPath } from '../utils/structor-config';
import { tsPlusBabel } from '../utils/ts-plus-babel';

export default async () => {
  log("Watching plugin's files.");

  const sourceBlob = 'src/**/*.{tsx,ts}';
  const watcher = gulp.watch(sourceBlob);

  await tsPlusBabel(tsBuiltPath.dir);

  // TODO: On create delete?
  watcher.on('change', async () => {
    log(colors.blue(`Start rebuild.`));
    await tsPlusBabel(tsBuiltPath.dir);
    log(colors.green(`End rebuild.`));
  });
};
