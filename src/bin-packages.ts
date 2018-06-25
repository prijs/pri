#!/usr/bin/env node

import './utils/global-state';

import * as commander from 'commander';
import * as updateNotifier from 'update-notifier';

import * as pkg from '../package.json';

import commandAdd from './pri-plugin-packages/add';
import commandLink from './pri-plugin-packages/link';

commander.version(pkg.version, '-v, --version');

commander
  .command(`add <gitUri>`)
  .description('Add remote package.')
  .action(async (gitUri: string) => {
    await commandAdd(gitUri);
  });

commander
  .command(`link`)
  .description('Link packages.')
  .action(async () => {
    await commandLink();
  });

/**
 * Parse argv.
 */
commander.parse(process.argv);

updateNotifier({ pkg }).notify();
