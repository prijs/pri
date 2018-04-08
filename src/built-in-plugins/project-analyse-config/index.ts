import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { configPaths } from "../../utils/structor-config"

interface IResult {
  projectAnalyseConfig: {
    hasConfig: boolean
  }
}

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  // src/config
  const whiteList = ["src/config"]
  instance.project.whiteFileRules.add(file => {
    return whiteList.some(whiteName => path.format(file) === path.join(projectRootPath, whiteName))
  })

  // src/config/config.default|local|prod.ts
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return (
      relativePath === "src/config" &&
      file.ext === ".ts" &&
      (file.name === "config.default" || file.name === "config.local" || file.name === "config.prod")
    )
  })

  instance.project.onAnalyseProject(files => {
    return {
      projectAnalyseConfig: {
        hasConfig:
          fs.existsSync(path.join(projectRootPath, path.format(configPaths.default))) ||
          fs.existsSync(path.join(projectRootPath, path.format(configPaths.local))) ||
          fs.existsSync(path.join(projectRootPath, path.format(configPaths.prod)))
      }
    } as IResult
  })
}
