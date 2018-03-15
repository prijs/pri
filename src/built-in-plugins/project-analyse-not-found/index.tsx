import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { notFoundPath } from "../../utils/structor-config"

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onAnalyseProject((files, entry) => {
    const notFoundFiles = files.filter(file => {
      if (
        path.format(file) !==
        path.join(projectRootPath, path.format(notFoundPath))
      ) {
        return false
      }

      return true
    })

    if (notFoundFiles.length !== 1) {
      return false
    }

    entry.pipeHeader(header => {
      return `
        ${header}
        import NotFoundComponent from "${normalizePath(
          path.join(
            projectRootPath,
            path.join(notFoundPath.dir, notFoundPath.name)
          )
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
