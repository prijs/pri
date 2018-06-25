#!/usr/bin/env node

import { globalState } from './utils/global-state';

import * as colors from 'colors';
import * as commander from 'commander';
import * as _ from 'lodash';
import * as updateNotifier from 'update-notifier';

import * as pkg from '../package.json';

import * as semver from 'semver';
import { log } from './utils/log';
import { loadPlugins, plugin } from './utils/plugins';

// Check node version
if (semver.lte(process.version, '8.0.0')) {
  log(colors.red(`nodejs version should be greater than 8, current is ${process.version}`));
  process.exit(0);
}

// Common options
commander.option('--cwd <path>', `Project root path. Default to current cwd - ${process.cwd()}`);

async function runCommandAction(commandDetails: any[], args: any[]) {
  const mainCommand = commandDetails.find(commandDetail => !!commandDetail.action);

  if (!mainCommand) {
    throw Error(`No main command!`);
  }

  for (const commandDetail of commandDetails) {
    if (commandDetail.beforeAction) {
      await Promise.resolve(commandDetail.beforeAction.apply(null, args));
    }
  }

  await Promise.resolve(mainCommand.action.apply(null, args));

  for (const commandDetail of commandDetails) {
    if (commandDetail.afterAction) {
      await Promise.resolve(commandDetail.afterAction.apply(null, args));
    }
  }
}

async function main() {
  if (['plugin', 'packages'].indexOf(globalState.majorCommand) === -1) {
    await loadPlugins();
  } else {
    commander.command('plugin', 'Operator for pri plugin.');
    commander.command('packages', 'Packages manager.');
  }

  commander.version(pkg.version, '-v, --version');

  const commandersGroupByName = _.groupBy(plugin.commands, 'name');
  Object.keys(commandersGroupByName).forEach(commandName => {
    const commandDetails = commandersGroupByName[commandName];
    const actionCount = commandDetails.reduce((count, commandDetail) => count + (commandDetail.action ? 1 : 0), 0);
    if (actionCount === 0) {
      throw Error(`No command "${commandName}!"`);
    }
    if (actionCount > 1) {
      throw Error(`Can't register "${commandName}" twice!`);
    }

    const mainCommand = commandDetails.find(commandDetail => !!commandDetail.action);

    if (!mainCommand) {
      throw Error(`No main command!`);
    }

    const command = commander
      .command(commandName)
      .description(mainCommand.description)
      .action(async (...args: any[]) => {
        await runCommandAction(commandDetails, args);
      });

    // Set options
    commandDetails.forEach(commandDetail => {
      if (commandDetail.options) {
        commandDetail.options.forEach(option => command.option.apply(command, option));
      }
    });
  });

  /**
   * When no args given, use dev command
   */
  if (!process.argv[2]) {
    const defaultCommand = plugin.commands.find(command => command.isDefault === true);

    if (defaultCommand) {
      await runCommandAction(commandersGroupByName[defaultCommand.name], commander.args);
    }
  }

  /**
   * Update notify.
   */
  updateNotifier({ pkg }).notify();

  /**
   * Parse argv.
   */
  commander.parse(process.argv);
}

main();
