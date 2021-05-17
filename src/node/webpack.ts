// TODO: webpack type is any

export const run = async (opts: any) => {
  const { runWebpack } = await import('../utils/webpack');
  await runWebpack(opts);
};

export const watch = async (opts: any) => {
  const { watchWebpack } = await import('../utils/webpack');
  await watchWebpack(opts);
};

export const devServer = async (opts: any, configWrapper?: (webpackConfig: any) => any) => {
  const { runWebpackDevServer } = await import('../utils/webpack-dev-server');
  await runWebpackDevServer(opts, configWrapper);
};

export const dll = async (opts: any) => {
  const { bundleDlls } = await import('../utils/webpack');
  await bundleDlls(opts);
};
