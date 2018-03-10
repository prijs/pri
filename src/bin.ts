#!/usr/bin/env node

import * as colors from "colors"
import * as commander from "commander"
import * as updateNotifier from "update-notifier"

import * as pkg from "../package.json"

import { CommandBuild } from "./commands/build"
import { CommandDev } from "./commands/dev"
import { CommandInit } from "./commands/init"
import { CommandPlugin } from "./commands/plugin"
import { CommandPreview } from "./commands/preview"

import { log } from "./utils/log"
import { initPlugins, pluginPackages } from "./utils/plugins"
import text from "./utils/text"

import { pri } from "./node"

initPlugins(process.cwd())

pluginPackages.forEach(pluginPackage => {
  pluginPackage.instance(pri)
})

commander.version(pkg.version, "-v, --version")

/**
 * Regist commander.
 */
const DEV = "dev"
commander.command(DEV)
  .description(text.commander.dev.description)
  .action(async () => {
    await CommandDev()
  })

const BUILD = "build"
commander.command(BUILD)
  .description(text.commander.build.description)
  .action(async (options) => {
    await CommandBuild()
  })

const PREVIEW = "preview"
commander.command(PREVIEW)
  .description(text.commander.preview.description)
  .action(async () => {
    await CommandPreview()
  })

const INIT = "init"
commander.command(INIT)
  .action(async () => {
    await CommandInit()
  })

const PLUGIN = "plugin"
commander.command(PLUGIN)
  .action(async () => {
    await CommandPlugin()
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
 * Update notify.
 */
updateNotifier({ pkg }).notify()

// Catch error.
process.on("unhandledRejection", error => {
  log(colors.red(error.toString()))
})
