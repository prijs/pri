import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as open from 'opn';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as webpackBundleAnalyzer from 'webpack-bundle-analyzer';
import { pri } from '../../node';
import { analyseProject } from '../../utils/analyse-project';
import { createEntry } from '../../utils/create-entry';
import { log, spinner } from '../../utils/log';
import text from '../../utils/text';
import { runWebpack } from '../../utils/webpack';

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['analyse'],
    description: 'Analyse project node_modules structor.',
    action: async () => {
      const result = await spinner('Analyse project', async () => {
        const analyseInfo = await analyseProject();
        const entryPath = createEntry();
        return { analyseInfo, entryPath };
      });

      // Build project
      const stats = await runWebpack({
        mode: 'production',
        entryPath: result.entryPath,
        pipeConfig: config => {
          config.plugins.push(new webpackBundleAnalyzer.BundleAnalyzerPlugin());
          return config;
        }
      });
    }
  });
};
