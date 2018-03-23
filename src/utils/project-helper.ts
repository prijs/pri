import * as fs from "fs-extra"
import * as path from "path"
import * as projectState from "./project-state"
import { tempPath } from "./structor-config"

export const hasNodeModules = (projectRootPath: string) => {
  return fs.existsSync(path.join(projectRootPath, "node_modules"))
}

export const hasNodeModulesModified = (projectRootPath: string) => {
  const key = "node_modules-modified-time"
  const nextModifiedTime = fs.statSync(path.join(projectRootPath, "node_modules")).mtime.toString()

  const previewModifiedTime = projectState.get(key)
  if (!previewModifiedTime) {
    projectState.set(key, nextModifiedTime)
    return true
  } else {
    if (previewModifiedTime !== nextModifiedTime) {
      return false
    }
  }
}
