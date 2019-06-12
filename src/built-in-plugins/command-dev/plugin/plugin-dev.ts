import * as path from 'path';
import * as nodeExternals from 'webpack-node-externals';
import { pluginEntry, pri } from '../../../node';
import { cleanDist } from '../../../utils/clean';
import { globalState } from '../../../utils/global-state';
import { watchWebpack } from '../../../utils/webpack';

export const pluginDev = async () => {
  // Because plugin need create files, so clear dist first.
  await cleanDist();

  await watchWebpack({
    mode: 'development',
    target: 'node',
    libraryTarget: 'commonjs2',
    entryPath: path.join(globalState.sourceRoot, path.format(pluginEntry)),
    externals: [nodeExternals()],
    outFileName: pri.projectConfig.outFileName
  });
};
