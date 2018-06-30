#!/usr/bin/env node

import './utils/global-state';

import * as commander from 'commander';
import * as semver from 'semver';
import * as updateNotifier from 'update-notifier';

import * as pkg from '../package.json';

import commandAdd from './built-in-plugins/packages/add';
import commandDev from './built-in-plugins/packages/dev';
import commandPublish from './built-in-plugins/packages/publish';
import commandPush from './built-in-plugins/packages/push';
import commandRemove from './built-in-plugins/packages/remove';
import commandUpdate from './built-in-plugins/packages/update';
import { loadPlugins } from './utils/plugins';

async function init() {
  await loadPlugins();

  commander.version(pkg.version, '-v, --version');

  commander
    .command(`add [gitUri]`)
    .description('Add remote package.')
    .action(async (gitUri: string) => {
      await commandAdd(gitUri);
    });

  commander
    .command(`rm [packageName]`)
    .description("Remove remote package(Won't delete it).")
    .action(async (packageName: string) => {
      await commandRemove(packageName);
    });

  commander
    .command(`dev [packageName]`)
    .description('Develop package.')
    .action(async (packageName: string) => {
      await commandDev(packageName);
    });

  commander
    .command(`push [packageName] [message]`)
    .description('Push package.')
    .action(async (packageName: string, message: string) => {
      await commandPush(packageName, message);
    });

  commander
    .command(`publish [packageName] [semver]`)
    .description('Publish package.')
    .action(async (packageName: string, semverStr: semver.ReleaseType) => {
      await commandPublish(packageName, semverStr);
    });

  commander
    .command(`update [packageName]`)
    .description('Update package.')
    .action(async (packageName: string) => {
      await commandUpdate(packageName);
    });

  // Upgrade to card TODO:
  // Add as template TODO:

  /**
   * Parse argv.
   */
  commander.parse(process.argv);

  updateNotifier({ pkg }).notify();
}

init();
