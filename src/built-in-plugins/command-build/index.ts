import { execSync } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as path from "path"
import * as prettier from "prettier"
import { pri, tempPath } from "../../node"
import * as pipe from "../../node/pipe"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { exec } from "../../utils/exec"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { plugin } from "../../utils/plugins"
import { getConfig } from "../../utils/project-config"
import { IProjectConfig } from "../../utils/project-config-interface"
import { tsBuiltPath } from "../../utils/structor-config"
import text from "../../utils/text"
import { runWebpack } from "../../utils/webpack"
import { getStaticHtmlPaths } from "./generate-static-html"

const projectRootPath = process.cwd()

export const CommandBuild = async (
  instance: typeof pri,
  opts?: {
    publicPath?: string
  }
) => {
  const env = "prod"
  const projectConfig = getConfig(projectRootPath, env)

  await spinner("Clean project.", async () => {
    // Clean dist dir
    await exec(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, projectConfig.distDir)}`)
    await exec(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, tsBuiltPath.dir)}`)

    // Clean .temp dir
    await exec(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, ".temp")}`)
  })

  await instance.project.ensureProjectFiles(projectConfig)
  await instance.project.lint()
  await instance.project.checkProjectFiles(projectConfig)

  const result = await spinner("Analyse project", async () => {
    const analyseInfo = await analyseProject(projectRootPath, env, projectConfig)
    const entryPath = createEntry(projectRootPath, env, projectConfig)
    return {
      analyseInfo,
      entryPath
    }
  })

  const staticHtmlPaths = getStaticHtmlPaths(projectRootPath, projectConfig, result.analyseInfo)

  // Build project
  const stats = await runWebpack({
    mode: "production",
    projectRootPath,
    env,
    entryPath: result.entryPath,
    publicPath: opts.publicPath, // If unset, use config value.
    projectConfig,
    pipeConfig: config => {
      staticHtmlPaths.forEach(staticHtmlPath => {
        config.plugins.push(
          new HtmlWebpackPlugin({
            title: projectConfig.title,
            filename: staticHtmlPath,
            template: path.join(__dirname, "../../../template-project.ejs")
          })
        )
      })
      return config
    }
  })

  // Write .temp/static/sw.js
  const tempSwPath = path.join(projectRootPath, tempPath.dir, "static/sw.js")
  const targetSwPath = path.join(projectRootPath, projectConfig.distDir, "sw.js")

  plugin.buildAfterProdBuild.forEach(afterProdBuild => afterProdBuild(stats, projectConfig))

  if (fs.existsSync(tempSwPath)) {
    const tempSwContent = fs.readFileSync(tempSwPath).toString()
    const targetSwContent = pipe.get("serviceWorkerAfterProdBuild", tempSwContent)
    fs.outputFileSync(
      targetSwPath,
      prettier.format(targetSwContent, {
        semi: true,
        singleQuote: true,
        parser: "babylon"
      })
    )
  }
}

export default async (instance: typeof pri) => {
  instance.project.onCreateEntry((analyseInfo, entry, env, projectConfig) => {
    if (env === "prod") {
      entry.pipeAppHeader(header => {
        return `
          ${header}
          setEnvProd()
        `
      })

      // Set prod env
      entry.pipeAppBody(body => {
        return `
          ${body}
        `
      })

      // Set custom env
      if (projectConfig.customEnv) {
        entry.pipeAppBody(body => {
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
    options: [["-c, --cloud", "Cloud build tag"], ["-p, --publicPath <pathname>", "rewrite publicPath"]],
    description: text.commander.build.description,
    action: async (options: any) => {
      await CommandBuild(instance, { publicPath: options.publicPath })

      // For async register commander, process will be exit automatic.
      process.exit(0)
    }
  })
}
