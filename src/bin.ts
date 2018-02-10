#!/usr/bin/env node

import * as commander from "commander";
import * as updateNotifier from "update-notifier"

import * as pkg from "../package.json"

import { CommandBuild } from "./commands/build"
import { CommandDev } from "./commands/dev"
import { CommandPreview } from "./commands/preview"
import { CommandUpdateDirStructure } from "./commands/update-dir-structure"

/**
 * -V --version
 */
commander.version(pkg.version, "-v, --version");

/**
 * Regist commander.
 */
const DEV = "dev"
commander.command(DEV)
  .description("Develop your project.")
  .action(async () => {
    await CommandDev()
  });

const BUILD = "build"
commander.command(BUILD)
  .description("Pack your project.")
  .action(async () => {
    await CommandBuild()
  });

const PREVIEW = "preview"
commander.command(PREVIEW)
  .description("Preview your project in production mode.")
  .action(async () => {
    await CommandPreview()
  });

const UPDATE_DIR_STRUCTURE = "update-dir-structure"
commander.command(UPDATE_DIR_STRUCTURE)
  .action(async () => {
    await CommandUpdateDirStructure()
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
