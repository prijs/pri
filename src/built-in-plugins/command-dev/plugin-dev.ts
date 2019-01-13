import { logFatal } from '../../utils/log';

export const pluginDev = async () => {
  // logText("Watching plugin's files.");

  // const sourceBlob = 'src/**/*.{tsx,ts}';
  // const watcher = gulp.watch(sourceBlob);

  // await tsPlusBabel(globalState.projectConfig.distDir);

  // // TODO: On create delete?
  // watcher.on('change', async () => {
  //   logAwait(`Start rebuild.`);
  //   await tsPlusBabel(globalState.projectConfig.distDir);
  //   logComplete(`End rebuild.`);
  // });
  logFatal('Not support yet');
};
