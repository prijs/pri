import * as path from 'path';
import * as nodeExternals from 'webpack-node-externals';
import { componentEntry, pri } from '../../../node';
import { cleanDist } from '../../../utils/clean';
import { globalState } from '../../../utils/global-state';
import { watchWebpack } from '../../../utils/webpack';

export const componentDev = async () => {
  // Because component need create files, so clear dist first.
  await cleanDist();

  await watchWebpack({
    mode: 'development',
    target: 'node',
    libraryTarget: 'commonjs2',
    entryPath: path.join(globalState.projectRootPath, path.format(componentEntry)),
    externals: [nodeExternals()],
    outFileName: pri.projectConfig.outFileName
  });
};
