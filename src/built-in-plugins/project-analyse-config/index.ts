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

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onAnalyseProject(files => {
    return {
      projectAnalyseConfig: {
        hasConfig:
          fs.existsSync(
            path.join(projectRootPath, path.format(configPaths.default))
          ) ||
          fs.existsSync(
            path.join(projectRootPath, path.format(configPaths.local))
          ) ||
          fs.existsSync(
            path.join(projectRootPath, path.format(configPaths.prod))
          )
      }
    } as IResult
  })
}
