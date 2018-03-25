import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import { pri } from "../../node"
import { ensurePrettierrc, ensureTsconfig, ensureTslint, ensureVscode, ensureDeclares } from "../../utils/ensure-files"
import { log } from "../../utils/log"
import { pluginPackages } from "../../utils/plugins"
import { ensureEntry, ensureGitignore, ensureNpmIgnore, ensurePackageJson } from "./ensure-plugin-files"

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

  log("\n Success init pri plugin, you can run serval commands:\n")

  log(colors.blue("  npm start"))

  log(`    Run typescript watch.`)

  log(colors.blue("  npm run release"))

  log(`    Publish this plugin.`)

  log(colors.blue("  npm test"))

  log(`    Run test.`)
}

export default (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: "plugin",
    action: CommandPlugin
  })

  instance.commands.registerCommand({ name: "plugin-init <pluginName>", action: CommandPluginInit })
}
