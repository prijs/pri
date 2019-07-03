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
    // Do not use sourceMap, otherwise main project won't load "require"
    devtool: false,
    entryPath: path.join(globalState.sourceRoot, path.format(componentEntry)),
    externals: [nodeExternals()],
    outFileName: pri.sourceConfig.outFileName
  });
};
