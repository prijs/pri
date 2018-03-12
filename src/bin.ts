#!/usr/bin/env node

import * as colors from "colors"
import * as commander from "commander"
import * as updateNotifier from "update-notifier"

import * as pkg from "../package.json"

import { log } from "./utils/log"
import { initPlugins, plugin, pluginPackages } from "./utils/plugins"
import text from "./utils/text"

import { pri } from "./node"

initPlugins(process.cwd())

commander.version(pkg.version, "-v, --version")

plugin.commands.forEach(command => {
  commander
    .command(command.name)
    .description(command.description)
    .action((...args: any[]) => {
      if (command.beforeActions) {
        command.beforeActions.forEach(beforeAction => beforeAction.apply(args))
      }
      command.action.apply(args)
      if (command.afterActions) {
        command.afterActions.forEach(afterAction => afterAction.apply(args))
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
