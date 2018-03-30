#!/usr/bin/env node

import * as colors from "colors"
import * as commander from "commander"
import * as updateNotifier from "update-notifier"

import * as pkg from "../package.json"

import * as semver from "semver"
import { log } from "./utils/log"
import { initPlugins, plugin, pluginPackages } from "./utils/plugins"
import text from "./utils/text"

import { pri } from "./node"

// Check node version
if (semver.lte(process.version, "8.0.0")) {
  log(`nodejs version should be greater than 8, current is ${process.version}`)
  process.exit(0)
}

initPlugins(process.cwd())

commander.version(pkg.version, "-v, --version")

plugin.commands.forEach(command => {
  commander
    .command(command.name)
    .description(command.description)
    .action((...args: any[]) => {
      if (command.beforeActions) {
        command.beforeActions.forEach(beforeAction => beforeAction.apply(null, args))
      }
      command.action.apply(null, args)
      if (command.afterActions) {
        command.afterActions.forEach(afterAction => afterAction.apply(null, args))
      }
    })
})

/**
 * Parse argv.
 */
commander.parse(process.argv)

/**
 * When no args given, use dev command
 */
if (!commander.args.length) {
  plugin.commands.find(command => command.isDefault === true).action()
}

/**
 * Update notify.
 */
updateNotifier({ pkg }).notify()

// Catch error.
process.on("unhandledRejection", error => {
  log(colors.red(error.toString()))
})
