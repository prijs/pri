import * as fs from "fs-extra"
import { flatten } from "lodash"
import * as path from "path"
import * as webpack from "webpack"
import { pri } from "../node/index"
import { Entry } from "./create-entry"
import { getDefault } from "./esModule"
import { IProjectConfig } from "./project-config-interface"

import pluginCommandBuild from "../built-in-plugins/command-build"
import pluginCommandDev from "../built-in-plugins/command-dev"
import pluginCommandInit from "../built-in-plugins/command-init"
import pluginCommandPlugin from "../built-in-plugins/command-plugin"
import pluginCommandPreview from "../built-in-plugins/command-preview"

import pluginProjectAnalyseConfig from "../built-in-plugins/project-analyse-config"
import pluginProjectAnalyseDob from "../built-in-plugins/project-analyse-dob"
import pluginProjectAnalyseLayouts from "../built-in-plugins/project-analyse-layouts"
import pluginProjectAnalyseMarkdownLayouts from "../built-in-plugins/project-analyse-markdown-layouts"
import pluginProjectAnalyseMarkdownPages from "../built-in-plugins/project-analyse-markdown-pages"
import pluginProjectAnalyseNotFound from "../built-in-plugins/project-analyse-not-found"
import pluginProjectAnalysePages from "../built-in-plugins/project-analyse-pages"

export interface ICommand {
  name?: string
  description?: string
  beforeActions?: any[]
  action?: any
  afterActions?: any[]
  isDefault?: boolean
}

export type IAnalyseProject = (
  projectFilesParsedPaths?: path.ParsedPath[],
  env?: "local" | "prod",
  projectConfig?: IProjectConfig
) => any

export type ICreateEntry = (
  analyseInfo?: any,
  entry?: Entry,
  env?: "local" | "prod",
  projectConfig?: IProjectConfig
) => void

export type IBuildConfigPipe = (
  env: "local" | "prod",
  config: webpack.Configuration
) => webpack.Configuration

let hasInitPlugins = false

export class IPluginConfig {
  public analyseInfo?: any = {}

  public commands?: ICommand[] = []

  public buildConfigPipes: IBuildConfigPipe[] = []

  public projectAnalyses: IAnalyseProject[] = []

  public projectCreateEntrys: ICreateEntry[] = []
}

export interface IPluginPackageInfo {
  name: string
  version: string
  instance: any
}

export const pluginPackages: IPluginPackageInfo[] = []
export const plugin: IPluginConfig = new IPluginConfig()

export const initPlugins = (projectRootPath: string) => {
  if (hasInitPlugins) {
    return
  }
  hasInitPlugins = true

  // Init built-in plugins
  pluginCommandBuild(pri)
  pluginCommandPreview(pri)
  pluginCommandInit(pri)
  pluginCommandPlugin(pri)
  pluginCommandDev(pri)
  pluginProjectAnalysePages(pri)
  pluginProjectAnalyseMarkdownPages(pri)
  pluginProjectAnalyseLayouts(pri)
  pluginProjectAnalyseMarkdownLayouts(pri)
  pluginProjectAnalyseDob(pri)
  pluginProjectAnalyseNotFound(pri)
  pluginProjectAnalyseConfig(pri)

  const projectPackageJsonPath = path.join(projectRootPath, "package.json")

  if (!fs.existsSync(projectPackageJsonPath)) {
    return
  }

  getPriPlugins(path.join(projectRootPath, "package.json")).forEach(
    eachPlugin => pluginPackages.push(eachPlugin)
  )

  // Init custom plugins
  pluginPackages.forEach(pluginPackage => {
    pluginPackage.instance(pri)
  })
}

function getPriPlugins(packageJsonPath: string): IPluginPackageInfo[] {
  const projectRootPath = path.resolve(packageJsonPath, "..")

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const packageJson = fs.readJSONSync(packageJsonPath)
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }

  return flatten(
    Object.keys(allDependencies)
      .filter(subPackageName => subPackageName.startsWith("pri-plugin"))
      .map(subPackageName => {
        const subPackageVersion = allDependencies[subPackageName]
        const subPackageRealEntry = subPackageVersion.startsWith("file:")
          ? path.join(
              projectRootPath,
              subPackageVersion.replace(/^file\:/g, "")
            )
          : subPackageName
        const subPackageAbsolutePath = require.resolve(
          path.join(path.join(subPackageRealEntry), "package.json")
        )
        const instance = getDefault(require(subPackageRealEntry))

        return [
          {
            instance,
            name: subPackageName,
            version: subPackageVersion
          },
          ...getPriPlugins(subPackageAbsolutePath)
        ]
      })
  )
}
