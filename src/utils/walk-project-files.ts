import * as fs from "fs-extra"
import * as path from "path"
import * as walk from "walk"
import { IProjectConfig } from "./project-config-interface"
import {
  declarePath,
  getGitignores,
  ignoreScanByNotDeployIgnore,
  pagesPath,
  tempPath,
  tsBuiltPath
} from "./structor-config"

type WalkStats = fs.Stats & {
  name: string
}

export function walkProjectFiles(projectRootPath: string, projectConfig: IProjectConfig): Promise<path.ParsedPath[]> {
  return new Promise((resolve, reject) => {
    const gitIgnores = getGitignores(projectConfig).map(dir => path.join(projectRootPath, dir))
    const scanIgnores = ignoreScanByNotDeployIgnore.map(addon => path.join(projectRootPath, addon))

    const walker = walk.walk(projectRootPath, { filters: [...gitIgnores, ...scanIgnores] })

    const files: Array<path.ParsedPath & { isDir: boolean }> = []

    walker.on("directories", (root: string, dirStatsArray: WalkStats[], next: () => void) => {
      if (root === projectRootPath) {
        // Skip project's root.
        next()
        return
      }

      files.push({ isDir: true, ...path.parse(root) })
      next()
    })

    walker.on("file", (root: string, fileStats: WalkStats, next: () => void) => {
      if (gitIgnores.concat(scanIgnores).some(ignorePath => ignorePath === path.join(root, fileStats.name))) {
        next()
        return
      }

      files.push({ isDir: false, ...path.parse(path.join(root, fileStats.name)) })
      next()
    })

    walker.on("errors", (root: string, nodeStatsArray: WalkStats, next: () => void) => {
      next()
    })

    walker.on("end", () => {
      resolve(files)
    })
  })
}
