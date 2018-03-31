import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import { pri } from "../../node"
import { ensureFile } from "../../utils/ensure-files"
import { log } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { pluginPackages } from "../../utils/plugins"
import { IProjectConfig } from "../../utils/project-config-interface"
import { tsBuiltPath } from "../../utils/structor-config"
import {
  ensureDeclares,
  ensureGitignore,
  ensurePrettierrc,
  ensureTsconfig,
  ensureTslint,
  ensureVscode
} from "../ensure-project-files"
import { ensureEntry, ensureNpmIgnore, ensurePackageJson, ensureTest } from "./ensure-plugin-files"
import { pluginBuild } from "./plugin-build"
import { CommandPluginWatch } from "./plugin-watch"

const CommandPlugin = async () => {
  pluginPackages.forEach(pluginPackage => {
    log(`${pluginPackage.name}@${pluginPackage.version}`)
  })
}

const CommandPluginInit = (projectRootPath: string, projectConfig: IProjectConfig) => {
  ensureDeclares(projectRootPath)

  const ensurePrettierrcResult = ensurePrettierrc(projectRootPath)
  ensureFile(projectRootPath, ensurePrettierrcResult.fileRelativePath, [ensurePrettierrcResult.pipeContent])

  const ensureTsconfigResult = ensureTsconfig(projectRootPath)
  ensureFile(projectRootPath, ensureTsconfigResult.fileRelativePath, [ensureTsconfigResult.pipeContent])

  const ensureTslintResult = ensureTslint(projectRootPath)
  ensureFile(projectRootPath, ensureTslintResult.fileRelativePath, [ensureTslintResult.pipeContent])

  const ensureVscodeResult = ensureVscode(projectRootPath)
  ensureFile(projectRootPath, ensureVscodeResult.fileRelativePath, [ensureVscodeResult.pipeContent])

  const ensureGitignoreResult = ensureGitignore(projectConfig)
  ensureFile(projectRootPath, ensureGitignoreResult.fileRelativePath, [ensureGitignoreResult.pipeContent])

  ensurePackageJson(projectRootPath)
  ensureNpmIgnore(projectRootPath, projectConfig)
  ensureEntry(projectRootPath)
  ensureTest(projectRootPath)

  log("\n Success init pri plugin, you can run serval commands:\n")

  log(colors.blue("  npm start"))

  log(`    Run typescript watch.`)

  log(colors.blue("  npm run release"))

  log(`    Publish this plugin.`)

  log(colors.blue("  npm test"))

  log(`    Run test.`)
}

const CommandPluginBuild = async (projectRootPath: string) => {
  execSync(`${findNearestNodemodulesFile("/.bin/rimraf")} ${tsBuiltPath.dir}`, { stdio: "inherit" })
  await pluginBuild(projectRootPath)
}

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()
  const projectConfig = instance.project.getProjectConfig("local")

  instance.commands.registerCommand({
    name: "plugin",
    action: CommandPlugin
  })

  instance.commands.registerCommand({
    name: "plugin-init",
    action: () => {
      CommandPluginInit(projectRootPath, projectConfig)
    }
  })

  instance.commands.registerCommand({
    name: "plugin-watch",
    action: () => {
      CommandPluginWatch(projectRootPath)
    }
  })

  instance.commands.registerCommand({
    name: "plugin-build",
    action: () => {
      CommandPluginBuild(projectRootPath)
    }
  })
}
