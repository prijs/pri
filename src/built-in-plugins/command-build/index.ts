import { execSync } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as path from "path"
import { pri } from "../../node"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"
import { IProjectConfig } from "../../utils/project-config-interface"
import text from "../../utils/text"
import { lint } from "../../utils/tslint"
import { generateStaticHtml } from "./generate-static-html"

const projectRootPath = process.cwd()

export const CommandBuild = async (
  option: {
    publicPath: string
  } = {
    publicPath: null
  }
) => {
  const env = "prod"
  const projectConfig = getConfig(projectRootPath, env)

  // tslint check
  lint(projectRootPath)

  // Clean dist dir
  execSync(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, projectConfig.distDir)}`)

  // Clean .temp dir
  execSync(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, ".temp")}`)

  ensureFiles(projectRootPath, projectConfig, false)

  const result = await spinner("Analyse project", async () => {
    const analyseInfo = await analyseProject(projectRootPath, env, projectConfig)
    const entryPath = createEntry(projectRootPath, env, projectConfig)
    return { analyseInfo, entryPath }
  })

  // Run webpack
  execSync(
    [
      `${findNearestNodemodulesFile(".bin/webpack")}`,
      `--progress`,
      `--mode production`,
      `--config ${path.join(__dirname, "../../utils/webpack-config.js")}`,
      `--env.projectRootPath ${projectRootPath}`,
      `--env.env ${env}`,
      `--env.entryPath ${result.entryPath}`,
      option.publicPath && `--env.publicPath ${option.publicPath}`
    ].join(" "),
    {
      stdio: "inherit",
      cwd: projectRootPath
    }
  )

  // If using staticBuild, generate index pages for all router.
  if (projectConfig.staticBuild) {
    await spinner("Generate static files.", async () => {
      await generateStaticHtml(projectRootPath, projectConfig, result.analyseInfo)
    })
  }
}

export default (instance: typeof pri) => {
  instance.project.onCreateEntry((analyseInfo, entry, env, projectConfig) => {
    if (env === "prod") {
      entry.pipeHeader(header => {
        return `
          ${header}
          setEnvProd()
        `
      })

      // Set prod env
      entry.pipeBody(body => {
        return `
          ${body}
        `
      })

      // Set custom env
      if (projectConfig.customEnv) {
        entry.pipeBody(body => {
          return `
            ${body}
            setCustomEnv(${JSON.stringify(projectConfig.customEnv)})
          `
        })
      }
    }
  })

  instance.commands.registerCommand({
    name: "build",
    description: text.commander.build.description,
    action: CommandBuild
  })
}
