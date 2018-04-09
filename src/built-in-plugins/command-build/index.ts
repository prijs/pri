import { execSync } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as path from "path"
import { pri } from "../../node"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"
import { IProjectConfig } from "../../utils/project-config-interface"
import text from "../../utils/text"
import { runWebpack } from "../../utils/webpack"
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

  // Clean dist dir
  execSync(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, projectConfig.distDir)}`)

  // Clean .temp dir
  execSync(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, ".temp")}`)

  const result = await spinner("Analyse project", async () => {
    const analyseInfo = await analyseProject(projectRootPath, env, projectConfig)
    const entryPath = createEntry(projectRootPath, env, projectConfig)
    return { analyseInfo, entryPath }
  })

  // Run webpack
  await runWebpack({
    mode: "production",
    projectRootPath,
    env,
    publicPath: option.publicPath,
    entryPath: result.entryPath,
    projectConfig
  })

  // If using staticBuild, generate index pages for all router.
  if (projectConfig.staticBuild) {
    await spinner("Generate static files.", async () => {
      await generateStaticHtml(projectRootPath, projectConfig, result.analyseInfo)
    })
  }
}

export default async (instance: typeof pri) => {
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
    action: async () => {
      const projectConfig = instance.project.getProjectConfig("prod")
      await instance.project.lint()
      await instance.project.ensureProjectFiles(projectConfig)
      await instance.project.checkProjectFiles(projectConfig)
      await CommandBuild()

      // For async register commander, process will be exit automatic.
      process.exit(0)
    }
  })
}
