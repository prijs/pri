import * as webpackBundleAnalyzer from 'webpack-bundle-analyzer';
import * as path from 'path';
import { analyseProject } from '../../../utils/analyse-project';
import { createEntry } from '../../../utils/create-entry';
import { spinner } from '../../../utils/log';
import { runWebpack } from '../../../utils/webpack';
import { globalState } from '../../../utils/global-state';
import { componentEntry } from '../../../utils/structor-config';

export const commandAnalyse = async () => {
  let entryPath: string = null;

  if (globalState.sourceConfig.type === 'project') {
    const result = await spinner('Analyse project', async () => {
      return { analyseInfo: await analyseProject(), entryPath: await createEntry() };
    });
    ({ entryPath } = result);
  } else if (globalState.sourceConfig.type === 'component') {
    entryPath = path.join(globalState.sourceRoot, path.format(componentEntry));
  }

  // Build project
  await runWebpack({
    mode: 'production',
    entryPath,
    pipeConfig: async config => {
      config.plugins.push(new webpackBundleAnalyzer.BundleAnalyzerPlugin());
      return config;
    },
  });
};
