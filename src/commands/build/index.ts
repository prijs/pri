import { execSync } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as path from "path"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { generateHtmlByRouterPath, generateStaticHtml } from "../../utils/generate-static-html"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"
import { IProjectConfig } from "../../utils/project-config-interface"
import { lint } from "../../utils/tslint"

const projectRootPath = process.cwd();

export const CommandBuild = async (options: {
  static?: boolean
}) => {
  const env = "prod"
  const projectConfig = getConfig(projectRootPath, env)

  // tslint check
  lint(projectRootPath)

  // Clean dist dir
  execSync(`rm -rf ${path.join(projectRootPath, projectConfig.distDir)}`)

  // Clean .temp dir
  execSync(`rm -rf ${path.join(projectRootPath, ".temp")}`)

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, projectConfig)
  })

  const result = await spinner("Analyse project", async () => {
    const projectInfo = await analyseProject(projectRootPath)
    const entryPath = await createEntry(projectInfo, projectRootPath, env, projectConfig)
    return {
      projectInfo, entryPath
    }
  })

  // Run parcel
  execSync(`${findNearestNodemodules()}/.bin/parcel build ${result.entryPath} --out-dir ${path.join(projectRootPath, projectConfig.distDir || "dist")}`, {
    stdio: "inherit",
    cwd: __dirname
  })

  // If using staticBuild, generate index pages for all router.
  if (projectConfig.staticBuild) {
    await spinner("Generate static files.", async () => {
      await generateStaticHtml(projectRootPath, projectConfig, result.projectInfo)
    })
  }

  generateHtmlByRouterPath("/", projectRootPath, projectConfig)
}
