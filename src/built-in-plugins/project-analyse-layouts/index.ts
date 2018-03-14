import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { layoutPath, tempJsEntryPath } from "../../utils/structor-config"

const LAYOUT = "LayoutComponent"
const LAYOUT_ROUTE = "LayoutRoute"

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onAnalyseProject((files, entry) => {
    let hasNormalLayout = false

    files
      .filter(file => {
        const relativePath = path.relative(
          projectRootPath,
          path.join(file.dir, file.name)
        )

        if (!relativePath.startsWith(layoutPath.dir)) {
          return false
        }

        return true
      })
      .forEach(file => {
        if (file.name === "index") {
          hasNormalLayout = true
        }
      })

    if (hasNormalLayout) {
      const layoutEntryRelativePath = path.relative(
        tempJsEntryPath.dir,
        path.join(layoutPath.dir, layoutPath.name)
      )

      entry.pipeHeader(header => {
        return `
        ${header}
        import ${LAYOUT} from "${normalizePath(layoutEntryRelativePath)}"
      `
      })

      entry.pipeBody(body => {
        return `
        ${body}

        const ${LAYOUT_ROUTE} = ({ component: Component, ...rest }: any) => {
          return (
            <Route {...rest} render={matchProps => (
              <${LAYOUT}>
                <Component {...matchProps} />
              </${LAYOUT}>
            )} />
          )
        }
      `
      })

      instance.pipe.set("commonRoute", route => {
        return LAYOUT_ROUTE
      })
    }
  })
}
