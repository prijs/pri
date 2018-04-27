import * as colors from "colors"
import * as fs from "fs-extra"
import * as _ from "lodash"
import * as open from "opn"
import * as path from "path"
import * as portfinder from "portfinder"
import * as webpackBundleAnalyzer from "webpack-bundle-analyzer"
import { pri } from "../../node"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { log, spinner } from "../../utils/log"
import { getConfig } from "../../utils/project-config"
import text from "../../utils/text"
import { runWebpack } from "../../utils/webpack"

export default async (instance: typeof pri) => {
  const env = "prod"
  const projectRootPath = instance.project.getProjectRootPath()
  const projectConfig = instance.project.getProjectConfig(env)

  instance.commands.registerCommand({
    name: "analyse",
    description: text.commander.init.description,
    action: async () => {
      const result = await spinner("Analyse project", async () => {
        const analyseInfo = await analyseProject(projectRootPath, env, projectConfig)
        const entryPath = createEntry(projectRootPath, env, projectConfig)
        return { analyseInfo, entryPath }
      })

      // Build project
      const stats = await runWebpack({
        mode: "production",
        projectRootPath,
        env,
        entryPath: result.entryPath,
        projectConfig,
        pipeConfig: config => {
          config.plugins.push(new webpackBundleAnalyzer.BundleAnalyzerPlugin())
          return config
        }
      })
    }
  })
}
