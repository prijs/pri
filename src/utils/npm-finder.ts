import * as fs from "fs"
import * as path from "path"

export const findNearestNodemodules = () => {
  return findNearestNodemodulesByPath(__dirname)
}

export const findNearestNodemodulesFile = (tryRelativeFilePath: string) => {
  const nodemodulePath = findNearestNodemodulesByPath(__dirname, tryRelativeFilePath)
  return path.join(nodemodulePath, tryRelativeFilePath)
}

function findNearestNodemodulesByPath(filePath: string, tryRelativeFilePath?: string): string {
  const findPath = path.join(filePath, "node_modules")

  if (fs.existsSync(findPath)) {
    if (!tryRelativeFilePath) {
      return findPath
    } else {
      const tryAbsoluteFilePath = path.join(findPath, tryRelativeFilePath)
      if (fs.existsSync(tryAbsoluteFilePath)) {
        return findPath
      }
    }
  }

  // Find parent dir
  return findNearestNodemodulesByPath(path.resolve(filePath, ".."), tryRelativeFilePath)
}
