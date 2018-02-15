import * as fs from "fs"
import * as path from "path"
import * as walk from "walk"
import { IProjectInfo } from './analyse-project-interface'

const PAGE_ROOT = "src/pages"
const LAYTOU_ROOT = "src/layouts"
const NOTFOUND_PATH = "src/404"
const STORE_ROOT = 'src/stores'

export const analyseProject = async (projectRootPath: string) => {
  const info = await walkProject(projectRootPath)

  if (
    hasFileWithoutExt(path.join(projectRootPath, 'src/config/config.default')) ||
    hasFileWithoutExt(path.join(projectRootPath, 'src/config/config.local')) ||
    hasFileWithoutExt(path.join(projectRootPath, 'src/config/config.prod'))
  ) {
    info.hasConfigFile = true
  }

  if (hasFileWithoutExt(path.join(projectRootPath, 'src/layouts/index'))) {
    info.hasLayoutFile = true
  }

  if (hasFileWithoutExt(path.join(projectRootPath, 'src/404'))) {
    info.has404File = true
  }

  return info
}

function hasFileWithoutExt(pathName: string) {
  const exts = ['.js', '.jsx', '.ts', '.tsx']
  for (let ext of exts) {
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

      const notFoundInfo = judgeNotFoundFile(projectRootPath, root, fileStats)
      if (notFoundInfo) {
        info.notFound = notFoundInfo
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

  if (!relativePath.startsWith(PAGE_ROOT)) {
    return null
  }

  const prefix = '/' + path.relative(PAGE_ROOT, relativePath)

  return {
    path: prefix,
    filePath: path.join(dir, fileStats.name),
    isIndex: fileInfo.name === "index"
  }
}

function judgeLayoutFile(projectRootPath: string, dir: string, fileStats: WalkStats) {
  const relativePath = path.relative(projectRootPath, dir)

  if (!relativePath.startsWith(LAYTOU_ROOT)) {
    return null
  }

  const pathInfo = path.parse(fileStats.name)

  // Use index file
  if (relativePath === LAYTOU_ROOT && pathInfo.name === "index") {
    return {
      filePath: path.join(dir, fileStats.name)
    }
  }

  return null
}

function judgeNotFoundFile(projectRootPath: string, dir: string, fileStats: WalkStats) {
  const relativePath = path.relative(projectRootPath, dir)
  const pathInfo = path.parse(fileStats.name)

  if (path.join(relativePath, pathInfo.dir, pathInfo.name) === NOTFOUND_PATH) {
    return {
      filePath: path.join(dir, fileStats.name)
    }
  }

  return null
}

function judgeStoreFile(projectRootPath: string, dir: string, fileStats: WalkStats) {
  const fileInfo = path.parse(fileStats.name)

  const relativePath = path.relative(projectRootPath, path.join(dir, fileInfo.name))

  if (!relativePath.startsWith(STORE_ROOT)) {
    return null
  }

  return {
    filePath: path.join(dir, fileStats.name),
    name: fileInfo.name
  }
}