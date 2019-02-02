import * as _ from 'lodash';
import * as webpackBundleAnalyzer from 'webpack-bundle-analyzer';
import { analyseProject } from '../../../utils/analyse-project';
import { createEntry } from '../../../utils/create-entry';
import { spinner } from '../../../utils/log';
import { runWebpack } from '../../../utils/webpack';

export const commandAnalyse = async () => {
  const result = await spinner('Analyse project', async () => {
    const analyseInfo = await analyseProject();
    const entryPath = await createEntry();
    return { analyseInfo, entryPath };
  });

  // Build project
  await runWebpack({
    mode: 'production',
    entryPath: result.entryPath,
    pipeConfig: config => {
      config.plugins.push(new webpackBundleAnalyzer.BundleAnalyzerPlugin());
      return config;
    }
  });
};
