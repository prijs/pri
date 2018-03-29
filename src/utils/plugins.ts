import * as fs from "fs-extra"
import { flatten } from "lodash"
import * as path from "path"
import * as webpack from "webpack"
import { pri } from "../node/index"
import { Entry } from "./create-entry"
import { getDefault } from "./esModule"
import { IProjectConfig } from "./project-config-interface"

const getBuiltInPlugins = (projectRootPath: string) => {
  const plugins = [
    ["pri-plugin-command-dev", "../built-in-plugins/command-dev/index.js"],
    ["pri-plugin-command-build", "../built-in-plugins/command-build/index.js"],
    ["pri-plugin-command-init", "../built-in-plugins/command-init/index.js"],
    ["pri-plugin-command-preview", "../built-in-plugins/command-preview/index.js"],
    ["pri-plugin-command-plugin", "../built-in-plugins/command-plugin/index.js"],
    ["pri-plugin-command-test", "../built-in-plugins/command-test/index.js"],
    ["pri-plugin-project-analyse-config", "../built-in-plugins/project-analyse-config/index.js"],
    ["pri-plugin-project-analyse-dob", "../built-in-plugins/project-analyse-dob/index.js"],
    ["pri-plugin-project-analyse-layouts", "../built-in-plugins/project-analyse-layouts/index.js"],
    ["pri-plugin-project-analyse-markdown-layouts", "../built-in-plugins/project-analyse-markdown-layouts/index.js"],
    ["pri-plugin-project-analyse-markdown-pages", "../built-in-plugins/project-analyse-markdown-pages/index.js"],
    ["pri-plugin-project-analyse-not-found", "../built-in-plugins/project-analyse-not-found/index.js"],
    ["pri-plugin-project-analyse-pages", "../built-in-plugins/project-analyse-pages/index.js"],
    ["pri-plugin-white-files", "../built-in-plugins/white-files/index.js"]
  ]

  return plugins.reduce((obj: any, right) => {
    obj[right[0]] = "file:" + path.relative(projectRootPath, path.join(__dirname, right[1]))
    return obj
  }, {})
}

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

export type IBuildConfigPipe = (env: "local" | "prod", config: webpack.Configuration) => webpack.Configuration

let hasInitPlugins = false

export type IWhiteFile = (file: path.ParsedPath & { isDir: boolean }) => boolean

export class IPluginConfig {
  public analyseInfo?: any = {}

  public commands?: ICommand[] = []

  public buildConfigPipes: IBuildConfigPipe[] = []

  public projectAnalyses: IAnalyseProject[] = []

  public projectCreateEntrys: ICreateEntry[] = []

  public whiteFileRules: IWhiteFile[] = []
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

  const projectPackageJsonPath = path.join(projectRootPath, "package.json")

  const builtInPlugins = getBuiltInPlugins(projectRootPath)

  getPriPlugins(path.join(projectRootPath, "package.json"), builtInPlugins).forEach(eachPlugin =>
    pluginPackages.push(eachPlugin)
  )

  // Init custom plugins
  pluginPackages.forEach(pluginPackage => {
    pluginPackage.instance(pri)
  })
}

function getPriPlugins(packageJsonPath: string, extendPlugins: any = {}): IPluginPackageInfo[] {
  const projectRootPath = path.resolve(packageJsonPath, "..")
  const packageJsonExist = fs.existsSync(packageJsonPath)

  const packageJson = packageJsonExist ? fs.readJsonSync(packageJsonPath) : null
  const allDependencies = packageJson
    ? {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...extendPlugins
      }
    : extendPlugins

  return flatten(
    Object.keys(allDependencies)
      .filter(subPackageName => subPackageName.startsWith("pri-plugin") || subPackageName.startsWith("@ali/pri-plugin"))
      .map(subPackageName => {
        const subPackageVersion = allDependencies[subPackageName]
        const subPackageRealEntry = subPackageVersion.startsWith("file:")
          ? path.join(projectRootPath, subPackageVersion.replace(/^file\:/g, ""))
          : subPackageName
        const subPackageRealEntryFilePath = require.resolve(subPackageRealEntry)
        const hasPackageJson = fs.existsSync(path.join(subPackageRealEntry, "package.json"))
        const subPackageAbsolutePath = hasPackageJson
          ? require.resolve(path.join(subPackageRealEntry, "package.json"))
          : null
        const instance = getDefault(require(subPackageRealEntry))

        // TODO: For client dashboard plugin
        // const subPackageClientAbsolutePath = path.resolve(subPackageRealEntryFilePath, "../client.js")

        // if (fs.existsSync(subPackageClientAbsolutePath)) {
        //   console.log("true", subPackageClientAbsolutePath)
        // }

        if (subPackageAbsolutePath) {
          return [
            {
              instance,
              name: subPackageName,
              version: subPackageVersion
            },
            ...getPriPlugins(subPackageAbsolutePath)
          ]
        } else {
          return [{ instance, name: subPackageName, version: subPackageVersion }]
        }
      })
  )
}
