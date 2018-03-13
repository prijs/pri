import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { pagesPath } from "../../utils/structor-config"

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onAnalyseProject(files => {
    const pages = files
      .filter(file => {
        const relativePath = path.relative(
          projectRootPath,
          path.join(file.dir, file.name)
        )

        if (!relativePath.startsWith(pagesPath.dir)) {
          return false
        }

        if (file.name !== "index") {
          return false
        }

        if ([".tsx", ".md"].indexOf(file.ext) === -1) {
          return false
        }

        return true
      })
      .map(file => {
        const relativePathWithoutIndex = path.relative(
          projectRootPath,
          file.dir
        )
        const routerPath =
          "/" + path.relative(pagesPath.dir, relativePathWithoutIndex)

        return {
          routerPath: normalizePath(routerPath),
          file
        }
      })
  })
}
