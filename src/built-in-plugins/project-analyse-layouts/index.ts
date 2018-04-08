import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { layoutPath, tempJsEntryPath } from "../../utils/structor-config"

const LAYOUT = "LayoutComponent"
const LAYOUT_ROUTE = "LayoutRoute"

interface IResult {
  projectAnalyseLayout: {
    hasLayout: boolean
  }
}

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  // src/layouts
  const whiteList = ["src/layouts"]
  instance.project.whiteFileRules.add(file => {
    return whiteList.some(whiteName => path.format(file) === path.join(projectRootPath, whiteName))
  })

  // src/layouts/markdown.tsx
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath === "src/layouts" && file.name === "index" && file.ext === ".tsx"
  })

  // src/layouts/markdown.style.tsx
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath === "src/layouts" && file.name === "index.style" && file.ext === ".ts"
  })

  instance.project.onAnalyseProject(files => {
    return {
      projectAnalyseLayout: {
        hasLayout: files
          .filter(file => {
            const relativePath = path.relative(projectRootPath, path.join(file.dir, file.name))

            if (!relativePath.startsWith(layoutPath.dir)) {
              return false
            }

            return true
          })
          .some(file => file.name === "index")
      }
    } as IResult
  })

  instance.project.onCreateEntry((analyseInfo: IResult, entry, env, projectConfig) => {
    if (!analyseInfo.projectAnalyseLayout.hasLayout) {
      return
    }

    const layoutEntryRelativePath = path.relative(tempJsEntryPath.dir, path.join(layoutPath.dir, layoutPath.name))

    entry.pipeHeader(header => {
      return `
        ${header}
        import ${entry.pipe.get("analyseLayoutImportName", LAYOUT)} from "${normalizePath(layoutEntryRelativePath)}"
      `
    })

    entry.pipeBody(body => {
      return `
        ${body}

        ${entry.pipe.get("analyseLayoutBody", "")}

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

    entry.pipe.set("commonRoute", route => {
      return LAYOUT_ROUTE
    })
  })
}
