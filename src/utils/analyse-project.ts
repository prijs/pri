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
  tempPath
} from "./structor-config"

export const analyseProject = async (projectRootPath: string, env: "local" | "prod", projectConfig: IProjectConfig) => {
  const { projectInfo, files } = await walkProject(projectRootPath, projectConfig)

  // Clear analyseInfo
  plugin.analyseInfo = {}

  plugin.projectAnalyses.forEach(projectAnalyse => {
    const result = projectAnalyse(files, env, projectConfig)
    if (result && typeof result === "object") {
      plugin.analyseInfo = { ...plugin.analyseInfo, ...result }
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

type WalkStats = fs.Stats & {
  name: string
}

function walkProject(
  projectRootPath: string,
  projectConfig: IProjectConfig
): Promise<{
  projectInfo: IProjectInfo
  files: path.ParsedPath[]
}> {
  const projectInfo = new IProjectInfo()

  return new Promise((resolve, reject) => {
    const walker = walk.walk(projectRootPath, {
      filters: [
        path.join(projectRootPath, "node_modules"),
        path.join(projectRootPath, ".git"),
        path.join(projectRootPath, tempPath.dir)
      ]
    })

    const files: path.ParsedPath[] = []

    walker.on("directories", (root: string, dirStatsArray: WalkStats[], next: () => void) => {
      next()
    })

    walker.on("file", (root: string, fileStats: WalkStats, next: () => void) => {
      if (root.startsWith(path.join(projectRootPath, projectConfig.distDir))) {
        next()
        return
      }

      files.push(path.parse(path.join(root, fileStats.name)))

      next()
    })

    walker.on("errors", (root: string, nodeStatsArray: WalkStats, next: () => void) => {
      next()
    })

    walker.on("end", () => {
      resolve({ projectInfo, files })
    })
  })
}
