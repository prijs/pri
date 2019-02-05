export const run = async (opts: any) => {
  const { runWebpack } = await import('../utils/webpack');
  await runWebpack(opts);
};

export const watch = async (opts: any) => {
  const { watchWebpack } = await import('../utils/webpack');
  await watchWebpack(opts);
};
