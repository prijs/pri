import * as path from 'path';
import * as nodeExternals from 'webpack-node-externals';
import { pluginEntry } from '../../../node';
import { globalState } from '../../../utils/global-state';
import { watchWebpack } from '../../../utils/webpack';

export const pluginDev = async () => {
  await watchWebpack({
    mode: 'development',
    target: 'node',
    libraryTarget: 'commonjs2',
    entryPath: path.join(globalState.projectRootPath, path.format(pluginEntry)),
    externals: [nodeExternals()],
    outFileName: 'main.js'
  });
};
