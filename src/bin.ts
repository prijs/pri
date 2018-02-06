#!/usr/bin/env node

import * as commander from "commander";
import * as updateNotifier from "update-notifier"

import * as pkg from "../package.json"

import { CommandBuild } from "./commands/build"
import { CommandDev } from "./commands/dev"

/**
 * -V --version
 */
commander.version(pkg.version, "-v, --version");

/**
 * Regist commander.
 */
const DEV = "dev"
commander.command(DEV)
  .description("Develop your project")
  .action(async (cardName: string) => {
    await CommandDev()
  });

const BUILD = "build"
commander.command(BUILD)
  .description("Pack your project")
  .action(async (cardName: string) => {
    await CommandBuild()
  });

/**
 * Parse argv.
 */
commander.parse(process.argv);

/**
 * When no args given, use dev command
 */
if (!commander.args.length) {
  CommandDev()
}

/**
 * update notify
 */
updateNotifier({ pkg }).notify()
