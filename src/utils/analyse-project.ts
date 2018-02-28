import * as fs from "fs"
import * as path from "path"
import * as walk from "walk"
import { IProjectInfo } from "./analyse-project-interface"
import {
  configPaths,
  layoutsPath,
  markdownPath,
  notFoundPath,
  pagesPath,
  storesPath
} from "./structor-config"

export const analyseProject = async (projectRootPath: string) => {
  const info = await walkProject(projectRootPath)

  if (
    fs.existsSync(path.join(projectRootPath, path.format(configPaths.default))) ||
    fs.existsSync(path.join(projectRootPath, path.format(configPaths.local))) ||
    fs.existsSync(path.join(projectRootPath, path.format(configPaths.prod)))
  ) {
    info.hasConfigFile = true
  }

  if (fs.existsSync(path.join(projectRootPath, path.format(layoutsPath)))) {
    info.hasLayoutFile = true
  }

  if (fs.existsSync(path.join(projectRootPath, path.format(notFoundPath)))) {
    info.has404File = true
  }

  if (fs.existsSync(path.join(projectRootPath, path.format(markdownPath)))) {
    info.hasMarkdownFile = true
  }

  return info
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

function walkProject(projectRootPath: string): Promise<IProjectInfo> {
  const info = new IProjectInfo()

  return new Promise((resolve, reject) => {
    const walker = walk.walk(projectRootPath, {
      filters: ["node_modules"]
    });

    walker.on("directories", (root: string, dirStatsArray: WalkStats[], next: () => void) => {
      next();
    });

    walker.on("file", (root: string, fileStats: WalkStats, next: () => void) => {
      const pageInfo = judgePageFile(projectRootPath, root, fileStats)
      if (pageInfo) {
        info.routes.push(pageInfo)
      }

      const layoutInfo = judgeLayoutFile(projectRootPath, root, fileStats)
      if (layoutInfo) {
        info.layout = layoutInfo
      }

      const storeInfo = judgeStoreFile(projectRootPath, root, fileStats)
      if (storeInfo) {
        info.stores.push(storeInfo)
      }

      next()
    });

    walker.on("errors", (root: string, nodeStatsArray: WalkStats, next: () => void) => {
      next()
    });

    walker.on("end", () => {
      resolve(info)
    });
  })
}

function judgePageFile(projectRootPath: string, dir: string, fileStats: WalkStats) {
  const fileInfo = path.parse(fileStats.name)

  const relativePath = fileInfo.name === "index" ?
    path.relative(projectRootPath, dir) :
    path.relative(projectRootPath, path.join(dir, fileInfo.name))

  if (!relativePath.startsWith(pagesPath.dir)) {
    return null
  }

  const prefix = "/" + path.relative(pagesPath.dir, relativePath)

  return {
    path: prefix,
    filePath: path.join(dir, fileStats.name),
    isIndex: fileInfo.name === "index"
  }
}

function judgeLayoutFile(projectRootPath: string, dir: string, fileStats: WalkStats) {
  const relativePath = path.relative(projectRootPath, dir)

  if (!relativePath.startsWith(layoutsPath.dir)) {
    return null
  }

  const pathInfo = path.parse(fileStats.name)

  // Use index file
  if (relativePath === layoutsPath.dir && pathInfo.name === "index") {
    return {
      filePath: path.join(dir, fileStats.name)
    }
  }

  return null
}

function judgeStoreFile(projectRootPath: string, dir: string, fileStats: WalkStats) {
  const fileInfo = path.parse(fileStats.name)

  const relativePath = path.relative(projectRootPath, path.join(dir, fileInfo.name))

  if (!relativePath.startsWith(storesPath.dir)) {
    return null
  }

  return {
    filePath: path.join(dir, fileStats.name),
    name: fileInfo.name
  }
}
