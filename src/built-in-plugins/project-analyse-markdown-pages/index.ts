import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import * as url from "url"
import { pri } from "../../node"
import { ensureStartWithWebpackRelativePoint } from "../../utils/functional"
import { md5 } from "../../utils/md5"
import { markdownTempPath, pagesPath, tempPath } from "../../utils/structor-config"

interface IResult {
  projectAnalyseMarkdownPages: {
    pages: Array<{
      routerPath: string
      file: path.ParsedPath
      chunkName: string
      componentName: string
    }>
  }
}

const safeName = (str: string) => _.upperFirst(_.camelCase(str))
const MARKDOWN_WRAPPER = "MarkdownWrapper"

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath.startsWith("src/pages") && file.name === "index" && file.ext === ".md"
  })

  instance.project.onAnalyseProject((files, env, projectConfig, setPipe) => {
    return {
      projectAnalyseMarkdownPages: {
        pages: files
          .filter(file => {
            const relativePath = path.relative(projectRootPath, path.join(file.dir, file.name))

            if (!relativePath.startsWith(pagesPath.dir)) {
              return false
            }

            if (file.name !== "index") {
              return false
            }

            if ([".md"].indexOf(file.ext) === -1) {
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
    if (analyseInfo.projectAnalyseMarkdownPages.pages.length === 0) {
      return
    }

    entry.pipeAppHeader(header => {
      return `
          ${header}
          import * as highlight from "highlight.js"
          import "highlight.js/styles/github.css"
          import markdownIt from "markdown-it"
        `
    })

    entry.pipeAppBody(body => {
      return `
          const markdown = markdownIt({
            html: true,
            linkify: true,
            typographer: true,
            highlight: (str: string, lang: string) => {
              if (lang === "tsx") {
                lang = "jsx"
              }

              if (lang === "typescript") {
                lang = "javascript"
              }

              if (lang && highlight.getLanguage(lang)) {
                try {
                  return highlight.highlight(lang, str).value;
                } catch (__) {
                  //
                }
              }

              return ""
            }
          })

          const ${MARKDOWN_WRAPPER} = ({ children }: any) => (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: markdown.render(children as string) }} />
          )

          ${body}
      `
    })

    entry.pipeAppComponent(entryComponent => {
      return `
        ${analyseInfo.projectAnalyseMarkdownPages.pages
          .map(page => {
            // Create esmodule file for markdown
            const fileContent = fs.readFileSync(path.format(page.file)).toString()
            const safeFileContent = fileContent.replace(/\`/g, `\\\``)
            const markdownTsAbsolutePath = path.join(projectRootPath, markdownTempPath.dir, page.componentName + ".ts")
            const markdownTsAbsolutePathWithoutExt = path.join(
              projectRootPath,
              markdownTempPath.dir,
              page.componentName
            )
            const markdownTsRelativePath = ensureStartWithWebpackRelativePoint(
              normalizePath(path.relative(tempPath.dir, markdownTsAbsolutePathWithoutExt))
            )

            fs.outputFileSync(markdownTsAbsolutePath, `export default \`${safeFileContent}\``)

            const markdownImportCode = `
              import(/* webpackChunkName: "${page.chunkName}" */ "${markdownTsRelativePath}").then(code => {
                ${entry.pipe.get("afterPageLoad", "")}
                return () => <${MARKDOWN_WRAPPER}>{code.default}</${MARKDOWN_WRAPPER}>
              })
            `

            return `
              const ${page.componentName} = Loadable({
                loader: () => ${markdownImportCode},
                modules: ["${markdownTsRelativePath}"],
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
      ${analyseInfo.projectAnalyseMarkdownPages.pages
        .map(page => {
          return `pageLoadableMap.set("${page.routerPath}", ${page.componentName})`
        })
        .join("\n")}
    `
    )

    entry.pipeAppRoutes(renderRoutes => {
      return `
        ${analyseInfo.projectAnalyseMarkdownPages.pages
          .map(page => {
            return `
              <${entry.pipe.get("markdownRoute", "Route")} exact path="${page.routerPath}" component={${
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
