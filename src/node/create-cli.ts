import * as updateNotifier from 'update-notifier';
import { execSync } from 'child_process';
import * as yargs from 'yargs';

import * as semver from 'semver';
import { globalState } from '../utils/global-state';
import { transferCommandsArrayToMap, TransferedRegisterCommand } from '../utils/commands';
import { logFatal } from '../utils/log';
import { loadPlugins, plugin } from '../utils/plugins';

// Check node version
if (semver.lte(process.version, '8.0.0')) {
  logFatal(`Nodejs version should be greater than 8, current is ${process.version}`);
}

// Check git repo
let isGitRepo = false;
try {
  if (
    execSync(`git rev-parse --is-inside-work-tree`)
      .toString()
      .trim() === 'true'
  ) {
    isGitRepo = true;
  }
} catch (error) {
  isGitRepo = false;
}
if (!isGitRepo) {
  logFatal(`Not a git repo, please run \`git init\` first.`);
}

export async function createCli(opts?: { pluginIncludeRoots: string[] }) {
  await loadPlugins(opts && opts.pluginIncludeRoots);

  const commandRegisterMap = transferCommandsArrayToMap(plugin.commands);

  registerYargs(yargs, commandRegisterMap);

  // eslint-disable-next-line no-unused-expressions
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
