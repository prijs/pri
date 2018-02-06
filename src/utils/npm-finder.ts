import * as fs from "fs"
import * as path from "path"

export const findNearestNodemodules = () => {
  return findNearestNodemodulesByPath(__dirname)
}

function findNearestNodemodulesByPath(filePath: string): string {
  const findPath = path.join(filePath, "node_modules")

  if (hasNodeModules(filePath)) {
    return findPath
  }

  // Find parent dir
  return findNearestNodemodulesByPath(path.resolve(filePath, ".."))
}

function hasNodeModules(filePath: string) {
  const findPath = path.join(filePath, "node_modules")

  if (fs.existsSync(findPath)) {
    return true
  }
  return false
}
