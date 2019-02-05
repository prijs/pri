import * as webpack from 'webpack';
import * as WebpackBar from 'webpackbar';
import { getWebpackConfig, IOptions } from './webpack-config';

interface IExtraOptions {
  pipeConfig?: (config?: webpack.Configuration) => Promise<webpack.Configuration>;
}

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false,
  colors: true,
  children: false
};

export const runWebpack = async (opts: IOptions<IExtraOptions>): Promise<any> => {
  const { pipeConfig, ...others } = opts;

  let webpackConfig = await getWebpackConfig(others);

  if (opts.pipeConfig) {
    webpackConfig = await opts.pipeConfig(webpackConfig);
  }

  webpackConfig.plugins.push(new WebpackBar());
  const compiler = webpack(webpackConfig);

  return runCompiler(compiler);
};

export const watchWebpack = async (opts: IOptions<IExtraOptions>): Promise<any> => {
  const { pipeConfig, ...others } = opts;

  let webpackConfig = await getWebpackConfig(others);

  if (opts.pipeConfig) {
    webpackConfig = await opts.pipeConfig(webpackConfig);
  }

  webpackConfig.plugins.push(new WebpackBar());
  const compiler = webpack(webpackConfig);

  compiler.watch({}, () => {});
};

function runCompiler(compiler: webpack.Compiler) {
  return new Promise(resolve => {
    compiler.run((err, status) => {
      if (!err && !status.hasErrors()) {
        process.stdout.write(status.toString(stats) + '\n\n');

        resolve(status.toJson());
      } else {
        if (err && err.message) {
          throw Error(err.message);
          process.exit(1);
        } else {
          throw Error(status.toString());
          process.exit(1);
        }
      }
    });
  });
}
