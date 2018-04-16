import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import * as url from "url"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { markdownTempPath, pagesPath, tempPath } from "../../utils/structor-config"

interface IResult {
  projectAnalysePages: {
    pages: Array<{
      routerPath: string
      file: path.ParsedPath
      chunkName: string
      componentName: string
    }>
  }
}

const safeName = (str: string) => _.upperFirst(_.camelCase(str))

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath.startsWith("src/pages") && file.name === "index" && file.ext === ".tsx"
  })

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

            const relativePageFilePath = path.relative(projectRootPath, file.dir + "/" + file.name)
            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5)

            return { routerPath, file, chunkName, componentName }
          })
      }
    } as IResult
  })

  instance.project.onCreateEntry((analyseInfo: IResult, entry, env, projectConfig) => {
    if (analyseInfo.projectAnalysePages.pages.length === 0) {
      return
    }

    entry.pipeAppComponent(entryComponent => {
      return `
        ${analyseInfo.projectAnalysePages.pages
          .map(page => {
            const pageRequirePath = normalizePath(path.relative(tempPath.dir, path.join(page.file.dir, page.file.name)))

            const importCode = `import(/* webpackChunkName: "${page.chunkName}" */ "${pageRequirePath}").then(code => {
                ${entry.pipe.get("afterPageLoad", "")}
                return code.default
              })`

            return `
              const ${page.componentName} = Loadable({
                loader: () => ${importCode},
                modules: ["${normalizePath(pageRequirePath)}"],
                loading: (): any => null
              })\n
            `
          })
          .join("\n")}
          ${entryComponent}
      `
    })

    entry.pipeAppComponent(
      str => `
      ${str}
      ${analyseInfo.projectAnalysePages.pages
        .map(page => {
          return `pageLoadableMap.set("${page.routerPath}", ${page.componentName})`
        })
        .join("\n")}
    `
    )

    entry.pipeAppRoutes(renderRoutes => {
      return `
        ${analyseInfo.projectAnalysePages.pages
          .map(page => {
            return `
              <${entry.pipe.get("commonRoute", "Route")} exact path="${page.routerPath}" component={${
              page.componentName
            }} />\n
            `
          })
          .join("\n")}
        ${renderRoutes}
      `
    })
  })
}
