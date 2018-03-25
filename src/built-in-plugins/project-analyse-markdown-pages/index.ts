import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import { markdownTempPath, pagesPath } from "../../utils/structor-config"

interface IResult {
  projectAnalyseMarkdownPages: {
    pages: Array<{
      routerPath: string
      file: path.ParsedPath
      chunkName: string
    }>
  }
}

const safeName = (str: string) => _.upperFirst(_.camelCase(str))
const MARKDOWN_WRAPPER = "MarkdownWrapper"

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onAnalyseProject(files => {
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

            return { routerPath, file, chunkName }
          })
      }
    } as IResult
  })

  instance.project.onCreateEntry((analyseInfo: IResult, entry, env, projectConfig) => {
    if (analyseInfo.projectAnalyseMarkdownPages.pages.length === 0) {
      return
    }

    entry.pipeHeader(header => {
      return `
          ${header}
          import * as highlight from "highlight.js"
          import "highlight.js/styles/github.css"
          import markdownIt from "markdown-it"
        `
    })

    entry.pipeBody(body => {
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

    entry.pipeEntryComponent(entryComponent => {
      return `
        ${analyseInfo.projectAnalyseMarkdownPages.pages
          .map(page => {
            const relativePageFilePath = path.relative(projectRootPath, page.file.dir + "/" + page.file.name)

            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5)

            // Create esmodule file for markdown
            const fileContent = fs.readFileSync(path.format(page.file)).toString()
            const safeFileContent = fileContent.replace(/\`/g, `\\\``)
            const markdownTsAbsolutePath = path.join(projectRootPath, markdownTempPath.dir, componentName + ".ts")
            const markdownTsAbsolutePathWithoutExt = path.join(projectRootPath, markdownTempPath.dir, componentName)

            fs.outputFileSync(markdownTsAbsolutePath, `export default \`${safeFileContent}\``)

            const markdownImportCode = `
              import(/* webpackChunkName: "${page.chunkName}" */ "${normalizePath(
              markdownTsAbsolutePathWithoutExt
            )}").then(code => {
                return () => <${MARKDOWN_WRAPPER}>{code.default}</${MARKDOWN_WRAPPER}>
              })
            `

            return `
              const ${componentName} = Loadable({
                loader: () => ${markdownImportCode},
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
        ${analyseInfo.projectAnalyseMarkdownPages.pages
          .map(page => {
            const relativePageFilePath = path.relative(projectRootPath, page.file.dir + "/" + page.file.name)

            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5)

            return `
              <${entry.pipe.get("markdownRoute", "Route")} exact path="${
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
        function createMarkdownPagePreload(href: string, as: string) {
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
          ${analyseInfo.projectAnalyseMarkdownPages.pages
            .map(page => {
              return `createMarkdownPagePreload("/static/${page.chunkName}.chunk.js", "script")`
            })
            .join("\n")}
        `
    })
  })
}
