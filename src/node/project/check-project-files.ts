import * as path from "path"
import { log } from "../../utils/log"
import { plugin } from "../../utils/plugins"
import { IProjectConfig } from "../../utils/project-config-interface"
import { walkProjectFiles } from "../../utils/walk-project-files"
import { getProjectRootPath } from "./get-project-root-path"

export const checkProjectFiles = async (projectConfig: IProjectConfig) => {
  log("Check project files.\n")
  const files = await walkProjectFiles(getProjectRootPath(), projectConfig)
  files.forEach(file => {
    if (!plugin.whiteFileRules.some(whiteFileRule => whiteFileRule(file))) {
      throw Error(`Unexpected file or directory: ${path.format(file)}`)
    }
  })
}
