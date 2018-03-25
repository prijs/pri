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
      chunkName: string
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
            const routerPath = normalizePath("/" + path.relative(pagesPath.dir, relativePathWithoutIndex))
            const chunkName = _.camelCase(routerPath) || "index"

            return { routerPath, file, chunkName }
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

            const pageRequirePath = normalizePath(path.join(page.file.dir, page.file.name))

            const importCode = `import(/* webpackChunkName: "${
              page.chunkName
            }" */ "${pageRequirePath}")${entry.pipe.get("normalPagesImportEnd", "")}`

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
        ${analyseInfo.projectAnalysePages.pages
          .map(page => {
            const relativePageFilePath = path.relative(projectRootPath, page.file.dir + "/" + page.file.name)

            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5)

            return `
              <${entry.pipe.get("commonRoute", "Route")} exact path="${
              page.routerPath
            }" component={${componentName}} />\n
            `
          })
          .join("\n")}
        ${renderRoutes}
      `
    })

    // Set preload links
    entry.pipeBody(body => {
      return `
        ${body}
        function createPagePreload(href: string, as: string) {
          const link: any = document.createElement("link")
          link.href = href
          link.rel = "preload"
          link.as = as
          document.head.appendChild(link)
        }
      `
    })

    entry.pipeEntryClassDidMount(entryDidMount => {
      return `
          ${entryDidMount}
          ${analyseInfo.projectAnalysePages.pages
            .map(page => {
              return `createPagePreload("/static/${page.chunkName}.chunk.js", "script")`
            })
            .join("\n")}
        `
    })
  })
}
