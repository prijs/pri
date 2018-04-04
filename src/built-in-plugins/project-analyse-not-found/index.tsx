import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { notFoundPath } from "../../utils/structor-config"

interface IResult {
  projectAnalyseNotFound: {
    hasNotFound: boolean
  }
}

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath === "src/pages" && file.name === "404" && file.ext === ".tsx"
  })

  instance.project.onAnalyseProject(files => {
    const notFoundFiles = files.filter(file => {
      if (path.format(file) !== path.join(projectRootPath, path.format(notFoundPath))) {
        return false
      }

      return true
    })

    return {
      projectAnalyseNotFound: { hasNotFound: notFoundFiles.length === 1 }
    } as IResult
  })

  instance.project.onCreateEntry((analyseInfo: IResult, entry, env, projectConfig) => {
    if (!analyseInfo.projectAnalyseNotFound.hasNotFound) {
      return
    }

    entry.pipeHeader(header => {
      return `
        ${header}
        import NotFoundComponent from "${normalizePath(
          path.join(projectRootPath, path.join(notFoundPath.dir, notFoundPath.name))
        )}"
      `
    })

    entry.pipeRenderRoutes(renderRoutes => {
      return `
        ${renderRoutes}
        <Route component={NotFoundComponent} />
      `
    })
  })
}
