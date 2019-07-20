import { cleanDist } from '../../../utils/clean';
import { tsPlusBabel } from '../../../utils/ts-plus-babel';
import { spinner, logInfo } from '../../../utils/log';
import { pri } from '../../../node';

export const componentDev = async () => {
  // Because component need create files, so clear dist first.
  await cleanDist();

  await spinner('Analyse project', async () => {
    await pri.project.ensureProjectFiles();
    await pri.project.checkProjectFiles();
  });

  // TODO: Wait for webpack5
  // await watchWebpack({
  //   mode: 'development',
  //   target: 'node',
  //   libraryTarget: 'commonjs2',
  //   // Do not use sourceMap, otherwise main project won't load "require"
  //   devtool: false,
  //   entryPath: path.join(globalState.sourceRoot, path.format(componentEntry)),
  //   externals: [nodeExternals()],
  //   outFileName: pri.sourceConfig.outFileName
  // });

  // Build all
  await spinner(`Init build`, async () => {
    await tsPlusBabel(false, true);
  });
  // Watch
  logInfo('Watching files..');
  await tsPlusBabel(true, true);
};
