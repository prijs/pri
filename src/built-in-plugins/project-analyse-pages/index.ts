import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { markdownTempPath, pagesPath } from "../../utils/structor-config"

interface IResult {
  projectAnalysePages: {
    pages: Array<{
      routerPath: string
      file: path.ParsedPath
    }>
  }
}

const safeName = (str: string) => _.upperFirst(_.camelCase(str))

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onAnalyseProject(files => {
    return {
      projectAnalysePages: {
        pages: files
          .filter(file => {
            const relativePath = path.relative(projectRootPath, path.join(file.dir, file.name))

            if (!relativePath.startsWith(pagesPath.dir)) {
              return false
            }

            if (file.name !== "index") {
              return false
            }

            if ([".tsx"].indexOf(file.ext) === -1) {
              return false
            }

            return true
          })
          .map(file => {
            const relativePathWithoutIndex = path.relative(projectRootPath, file.dir)
            const routerPath = "/" + path.relative(pagesPath.dir, relativePathWithoutIndex)

            return { routerPath: normalizePath(routerPath), file }
          })
      }
    } as IResult
  })

  instance.project.onCreateEntry((analyseInfo: IResult, entry, env, projectConfig) => {
    if (analyseInfo.projectAnalysePages.pages.length === 0) {
      return
    }

    entry.pipeEntryComponent(entryComponent => {
      return `
        ${analyseInfo.projectAnalysePages.pages
          .map(page => {
            const relativePageFilePath = path.relative(projectRootPath, page.file.dir + "/" + page.file.name)

            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5)
            const chunkName = _.camelCase(page.routerPath) || "index"

            const pageRequirePath = normalizePath(path.join(page.file.dir, page.file.name))

            const importCode = `import(/* webpackChunkName: "${chunkName}" */ "${pageRequirePath}")${entry.pipe.get(
              "normalPagesImportEnd",
              ""
            )}`

            return `
              const ${componentName} = Loadable({
                loader: () => ${importCode},
                loading: (): any => null
              })\n
            `
          })
          .join("\n")}
          ${entryComponent}
      `
    })

    entry.pipeRenderRoutes(renderRoutes => {
      return `
        ${renderRoutes}
        ${analyseInfo.projectAnalysePages.pages
          .map(page => {
            const relativePageFilePath = path.relative(projectRootPath, page.file.dir + "/" + page.file.name)

            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5)
            const chunkName = _.camelCase(page.routerPath) || "index"

            return `
              <${entry.pipe.get("commonRoute", "Route")} exact path="${
              page.routerPath
            }" component={${componentName}} />\n
            `
          })
          .join("\n")}
      `
    })
  })
}
