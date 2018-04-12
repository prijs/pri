import * as fs from "fs"
import * as normalizePath from "normalize-path"
import * as path from "path"
import * as walk from "walk"
import * as pipe from "../node/pipe"
import { IProjectInfo } from "./analyse-project-interface"
import { createEntry, Entry } from "./create-entry"
import { plugin } from "./plugins"
import { IProjectConfig } from "./project-config-interface"
import {
  configPaths,
  layoutPath,
  markdownLayoutPath,
  notFoundPath,
  pagesPath,
  storesPath,
  tempPath,
  tsBuiltPath
} from "./structor-config"
import { walkProjectFiles } from "./walk-project-files"

export const analyseProject = async (projectRootPath: string, env: "local" | "prod", projectConfig: IProjectConfig) => {
  const files = await walkProjectFiles(projectRootPath, projectConfig)

  // Clear analyseInfo
  plugin.analyseInfo = {}

  // Clear pipe
  pipe.clear()

  plugin.projectAnalyses.forEach(projectAnalyse => {
    const result = projectAnalyse(files, env, projectConfig)
    if (result && typeof result === "object") {
      plugin.analyseInfo = {
        ...plugin.analyseInfo,
        ...result
      }
    }
  })

  return plugin.analyseInfo
}

function hasFileWithoutExt(pathName: string) {
  const exts = [".js", ".jsx", ".ts", ".tsx"]
  for (const ext of exts) {
    if (fs.existsSync(pathName + ext)) {
      return true
    }
  }
  return false
}
