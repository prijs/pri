import * as fs from "fs"
import * as path from "path"
import * as walk from "walk"

const PAGE_ROOT = "src/pages"
const LAYTOU_ROOT = "src/layouts"

export const analyseProject = async (projectRootPath: string) => {
  const info = await walkProject(projectRootPath)
  return info
}

type WalkStats = fs.Stats & {
  name: string
}

export class Info {
  public routes: Array<{
    path: string
    filePath: string
    isIndex: boolean
  }> = []
  public layout: {
    filePath: string
  } | null = null
}

function walkProject(projectRootPath: string): Promise<Info> {
  const info = new Info()

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

  const prefix = path.relative(PAGE_ROOT, relativePath)

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
