import * as fs from "fs-extra"
import * as path from "path"
import * as React from "react"
import * as url from "url"
import { IProjectConfig } from "../../utils/project-config-interface"
import { tempJsAppPath, tempPath, tsBuiltPath } from "../../utils/structor-config"

export function getStaticHtmlPaths(projectRootPath: string, projectConfig: IProjectConfig, analyseInfo: any) {
  const pages = analyseInfo.projectAnalysePages ? analyseInfo.projectAnalysePages.pages : []
  const markdownPages = analyseInfo.projectAnalyseMarkdownPages ? analyseInfo.projectAnalyseMarkdownPages.pages : []

  const allPages = [...pages, ...markdownPages]

  return allPages.map(page => {
    const relativePathWithSuffix = path.join(page.routerPath, "index.html")
    return path.join(projectRootPath, projectConfig.distDir, relativePathWithSuffix)
  })
}
