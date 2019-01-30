import { logFatal } from '../../utils/log';
import { runWebpackDevServer } from '../../utils/webpack-dev-server';

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


  // await runWebpackDevServer({
  //   mode: 'development',
  //   publicPath: '/static/',
  //   entryPath: dashboardEntryFilePath,
  //   devServerPort: freePort,
  //   outFileName: 'main.[hash].js',
  //   htmlTemplatePath: path.join(__dirname, '../../../template-dashboard.ejs'),
  //   htmlTemplateArgs: {
  //     dashboardServerPort,
  //     libraryStaticPath
  //   },
  //   webpackBarOptions: {
  //     name: 'dashboard'
  //   }
  // });
};
