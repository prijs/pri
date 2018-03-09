import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import { log } from "../../utils/log"
import { getPlugins } from "../../utils/plugins"

const projectRootPath = process.cwd()

export const CommandPlugin = async () => {
  const plugins = getPlugins(projectRootPath)
  plugins.forEach(plugin => {
    log(`${plugin.name}@${plugin.version}`)
  })
}
