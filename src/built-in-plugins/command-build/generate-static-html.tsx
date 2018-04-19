import * as fs from "fs-extra"
import * as path from "path"
import * as React from "react"
import * as url from "url"
import { IProjectConfig } from "../../utils/project-config-interface"
import { tempJsAppPath, tempPath, tsBuiltPath } from "../../utils/structor-config"

export async function generateStaticHtml(
  projectRootPath: string,
  projectConfig: IProjectConfig,
  analyseInfo: any,
  stats: any
) {
  const pages = analyseInfo.projectAnalysePages ? analyseInfo.projectAnalysePages.pages : []
  const markdownPages = analyseInfo.projectAnalyseMarkdownPages ? analyseInfo.projectAnalyseMarkdownPages.pages : []

  const allPages = [...pages, ...markdownPages]

  allPages.forEach(page => {
    generateHtmlByRouterPath(page.routerPath, projectRootPath, projectConfig, stats)
  })
}

export function generateHtmlByRouterPath(
  routerPath: string,
  projectRootPath: string,
  projectConfig: IProjectConfig,
  stats: any
) {
  const relativePathWithSuffix = path.join(routerPath, "index.html")
  const htmlPath = path.join(projectRootPath, projectConfig.distDir, relativePathWithSuffix)

  const cssPath = path.join(projectRootPath, projectConfig.distDir, `main.${stats.hash}.css`)
  const hasCssOutput = fs.existsSync(cssPath)

  fs.outputFileSync(
    htmlPath,
    `
    <html>

    <head>
      <title>${projectConfig.title}</title>

      ${
        hasCssOutput
          ? `
        <link rel="stylesheet" type="text/css" href="${getEntryPath(projectConfig, `main.${stats.hash}.css`)}"/>
      `
          : ""
      }
    </head>

    <body>
      <script src="${getEntryPath(projectConfig, `main.${stats.hash}.js`)}"></script>
    </body>

    </html>
  `
  )
}

function getEntryPath(projectConfig: IProjectConfig, entryFileName: string) {
  const finalPublicPath = projectConfig.publicPath

  let entryPath = "/" + entryFileName

  if (finalPublicPath) {
    if (finalPublicPath.startsWith("/")) {
      entryPath = path.join(finalPublicPath, entryFileName)
    } else {
      entryPath = url.resolve(finalPublicPath, entryFileName)
    }
  }

  return entryPath
}
