import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import { pri } from "../../node"
import { log } from "../../utils/log"
import { pluginPackages } from "../../utils/plugins"

const projectRootPath = process.cwd()

export const CommandPlugin = async () => {
  pluginPackages.forEach(pluginPackage => {
    log(`${pluginPackage.name}@${pluginPackage.version}`)
  })
}

export default (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: "plugin",
    action: CommandPlugin
  })
}
