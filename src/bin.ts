#!/usr/bin/env node

import * as colors from "colors"
import * as commander from "commander";
import * as updateNotifier from "update-notifier"

import * as pkg from "../package.json"

import { CommandBuild } from "./commands/build"
import { CommandDev } from "./commands/dev"
import { CommandInit } from "./commands/init"
import { CommandPreview } from "./commands/preview"

import { log } from "./utils/log"

/**
 * -V --version
 */
commander.version(pkg.version, "-v, --version")

/**
 * Regist commander.
 */
const DEV = "dev"
commander.command(DEV)
  .description("Develop your project.")
  .action(async () => {
    await CommandDev()
  })

const BUILD = "build"
commander.command(BUILD)
  .description("Pack your project.")
  .action(async (options) => {
    await CommandBuild()
  })

const PREVIEW = "preview"
commander.command(PREVIEW)
  .description("Preview your project in production mode.")
  .action(async () => {
    await CommandPreview()
  })

const INIT = "init"
commander.command(INIT)
  .action(async () => {
    await CommandInit()
  })

/**
 * Parse argv.
 */
commander.parse(process.argv)

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

// 捕获异常
process.on("unhandledRejection", error => {
  log(colors.red(error.toString()))
})
