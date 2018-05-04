#!/usr/bin/env node

import * as colors from "colors"
import * as commander from "commander"
import * as _ from "lodash"
import * as updateNotifier from "update-notifier"

import * as pkg from "../package.json"

import * as semver from "semver"
import { log } from "./utils/log"
import { initPlugins, plugin } from "./utils/plugins"
import { getConfig } from "./utils/project-config"
import text from "./utils/text"

import commandBuild from "./pri-plugin-commanders/build"
import commandInit from "./pri-plugin-commanders/init"
import commandTest from "./pri-plugin-commanders/test"
import commandWatch from "./pri-plugin-commanders/watch"

const projectRootPath = process.cwd()
const projectConfig = getConfig(projectRootPath, "local")

commander.version(pkg.version, "-v, --version")

commander
  .command(`init`)
  .description("Init plugin project")
  .action(async () => {
    await commandInit(projectRootPath, projectConfig)
  })

commander
  .command(`watch`)
  .description("Watch plugin files")
  .action(async () => {
    await commandWatch(projectRootPath)
  })

commander
  .command(`build`)
  .description("Bundle plugin")
  .action(async () => {
    await commandBuild(projectRootPath)
  })

commander
  .command(`test`)
  .description("Run test")
  .action(async () => {
    await commandTest(projectRootPath)
    process.exit(0)
  })

/**
 * Parse argv.
 */
commander.parse(process.argv)

updateNotifier({ pkg }).notify()
