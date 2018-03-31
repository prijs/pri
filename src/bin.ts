#!/usr/bin/env node

import * as colors from "colors"
import * as commander from "commander"
import * as _ from "lodash"
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

const commandersGroupByName = _.groupBy(plugin.commands, "name")
Object.keys(commandersGroupByName).forEach(commandName => {
  const commandDetails = commandersGroupByName[commandName]
  const actionCount = commandDetails.reduce((count, commandDetail) => count + (commandDetail.action ? 1 : 0), 0)
  if (actionCount === 0) {
    throw Error(`No command "${commandName}!"`)
  }
  if (actionCount > 1) {
    throw Error(`Can't register "${commandName}" twice!`)
  }

  const mainCommand = commandDetails.find(commandDetail => !!commandDetail.action)

  commander
    .command(commandName)
    .description(mainCommand.description)
    .action(async (...args: any[]) => {
      for (const commandDetail of commandDetails) {
        if (commandDetail.beforeAction) {
          await commandDetail.beforeAction.apply(null, args)
        }
      }

      await mainCommand.action.apply(null, args)

      for (const commandDetail of commandDetails) {
        if (commandDetail.afterAction) {
          await commandDetail.afterAction.apply(null, args)
        }
      }
    })
})

// plugin.commands.forEach(command => {
// commander
//   .command(command.name)
//   .description(command.description)
//   .action((...args: any[]) => {
//     if (command.beforeActions) {
//       command.beforeActions.forEach(beforeAction => beforeAction.apply(null, args))
//     }
//     command.action.apply(null, args)
//     if (command.afterActions) {
//       command.afterActions.forEach(afterAction => afterAction.apply(null, args))
//     }
//   })
// })

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
