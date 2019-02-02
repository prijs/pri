import * as _ from 'lodash';
import * as webpackBundleAnalyzer from 'webpack-bundle-analyzer';
import { pri } from '../../../node';
import { analyseProject } from '../../../utils/analyse-project';
import { createEntry } from '../../../utils/create-entry';
import { spinner } from '../../../utils/log';
import { runWebpack } from '../../../utils/webpack';

pri.commands.registerCommand({
  name: ['analyse'],
  description: 'Analyse project node_modules structor.',
  action: async () => {
    const commandAnalyseModule = await import('./command-analyse');
    await commandAnalyseModule.commandAnalyse();
  }
});
