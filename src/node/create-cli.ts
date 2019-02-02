import { globalState } from '../utils/global-state';

import * as _ from 'lodash';
import * as updateNotifier from 'update-notifier';
import * as yargs from 'yargs';

import * as semver from 'semver';
import { transferCommandsArrayToMap, TransferedRegisterCommand } from '../utils/commands';
import { logFatal } from '../utils/log';
import { loadPlugins, plugin } from '../utils/plugins';

// Check node version
if (semver.lte(process.version, '8.0.0')) {
  logFatal(`Nodejs version should be greater than 8, current is ${process.version}`);
}

if (globalState.projectPackageJson.pri.version) {
  if (semver.lt(globalState.priPackageJson.version, globalState.projectPackageJson.pri.version)) {
    logFatal(
      `Current pri version: ${globalState.priPackageJson.version} is less then this project's: ${
        globalState.projectPackageJson.pri.version
      }`
    );
  }
}

export async function createCli(opts?: { pluginIncludeRoots: string[] }) {
  await loadPlugins(opts && opts.pluginIncludeRoots);

  const commandRegisterMap = transferCommandsArrayToMap(plugin.commands);

  registerYargs(yargs, commandRegisterMap);

  // tslint:disable-next-line:no-unused-expression
  yargs.alias('help', 'h').alias('version', 'v').argv;

  /**
   * Update notify.
   */
  updateNotifier({ pkg: globalState.priPackageJson }).notify();
}

function registerYargs(leafYargs: typeof yargs, transferedRegisterCommands: TransferedRegisterCommand[]) {
  transferedRegisterCommands.forEach(commandRegister => {
    leafYargs.command({
      command: commandRegister.name[0],
      describe: commandRegister.description || '',
      aliases: commandRegister.alias,
      builder: childYargs => {
        if (commandRegister.options) {
          Object.keys(commandRegister.options).forEach(optionName => {
            const optionInfo = commandRegister.options[optionName];
            childYargs.option(optionName, {
              alias: optionInfo.alias,
              description: optionInfo.description,
              demandOption: optionInfo.required
            });
          });
        }

        registerYargs(childYargs, commandRegister.childs);

        return childYargs;
      },
      handler: async argv => {
        if (commandRegister.beforeAction) {
          await commandRegister.beforeAction(argv);
        }

        if (commandRegister.action) {
          await commandRegister.action(argv);
        }

        if (commandRegister.afterAction) {
          await commandRegister.afterAction(argv);
        }
      }
    });
  });
}
