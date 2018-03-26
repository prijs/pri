import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import { pri } from "../../node"
import { ensureDeclares, ensurePrettierrc, ensureTsconfig, ensureTslint, ensureVscode } from "../../utils/ensure-files"
import { log } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { pluginPackages } from "../../utils/plugins"
import { ensureEntry, ensureGitignore, ensureNpmIgnore, ensurePackageJson, ensureTest } from "./ensure-plugin-files"
import { pluginBuild } from "./plugin-build"
import { builtDir } from "./static"

const projectRootPath = process.cwd()

const CommandPlugin = async () => {
  pluginPackages.forEach(pluginPackage => {
    log(`${pluginPackage.name}@${pluginPackage.version}`)
  })
}

const CommandPluginInit = (pluginName: string) => {
  ensureGitignore(projectRootPath)
  ensureTsconfig(projectRootPath)
  ensureTslint(projectRootPath)
  ensureVscode(projectRootPath)
  ensurePrettierrc(projectRootPath)
  ensurePackageJson(projectRootPath, pluginName)
  ensureEntry(projectRootPath)
  ensureNpmIgnore(projectRootPath)
  ensureDeclares(projectRootPath)
  ensureTest(projectRootPath)

  log("\n Success init pri plugin, you can run serval commands:\n")

  log(colors.blue("  npm start"))

  log(`    Run typescript watch.`)

  log(colors.blue("  npm run release"))

  log(`    Publish this plugin.`)

  log(colors.blue("  npm test"))

  log(`    Run test.`)
}

const CommandPluginWatch = () => {
  execSync(`${findNearestNodemodulesFile("/.bin/tsc")} -w`, { stdio: "inherit" })
}

const CommandPluginBuild = async () => {
  execSync(`${findNearestNodemodulesFile("/.bin/rimraf")} ${builtDir}`, { stdio: "inherit" })
  await pluginBuild(projectRootPath)
}

export default (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: "plugin",
    action: CommandPlugin
  })

  instance.commands.registerCommand({ name: "plugin-init <pluginName>", action: CommandPluginInit })

  instance.commands.registerCommand({ name: "plugin-watch", action: CommandPluginWatch })

  instance.commands.registerCommand({ name: "plugin-build", action: CommandPluginBuild })
}
