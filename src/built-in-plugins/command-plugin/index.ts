import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import { pri } from "../../node"
import { ensurePrettierrc, ensureTsconfig, ensureTslint, ensureVscode } from "../../utils/ensure-files"
import { log } from "../../utils/log"
import { pluginPackages } from "../../utils/plugins"
import { ensureEntry, ensureGitignore, ensurePackageJson } from "./ensure-plugin-files"

const projectRootPath = process.cwd()

const CommandPlugin = async () => {
  pluginPackages.forEach(pluginPackage => {
    log(`${pluginPackage.name}@${pluginPackage.version}`)
  })
}

const CommandPluginInit = () => {
  ensureGitignore(projectRootPath)
  ensureTsconfig(projectRootPath)
  ensureTslint(projectRootPath)
  ensureVscode(projectRootPath)
  ensurePrettierrc(projectRootPath)
  ensurePackageJson(projectRootPath)
  ensureEntry(projectRootPath)
}

export default (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: "plugin",
    action: CommandPlugin
  })

  instance.commands.registerCommand({ name: "plugin-init", action: CommandPluginInit })
}
