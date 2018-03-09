import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import { log } from "../../utils/log"
import { plugins } from "../../utils/plugins"

const projectRootPath = process.cwd()

export const CommandPlugin = async () => {
  plugins.forEach(plugin => {
    log(`${plugin.name}@${plugin.version}`)
  })
}
