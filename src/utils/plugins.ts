import * as colors from "colors"
import * as fs from "fs-extra"
import { flatten } from "lodash"
import * as path from "path"
import * as webpack from "webpack"
import { pri } from "../node/index"
import { set } from "../node/pipe"
import { Entry } from "./create-entry"
import { getDefault } from "./esModule"
import { log } from "./log"
import { IProjectConfig } from "./project-config-interface"

export interface IPluginPackageInfo {
  name: string
  version: string
  instance: any
  pathOrModuleName: string
  config: {
    dependencies: string[]
  }
}

export const loadedPlugins = new Set<IPluginPackageInfo>()

const getBuiltInPlugins = (projectRootPath: string) => {
  const plugins = [
    ["pri-plugin-command-dev", "../built-in-plugins/command-dev/index.js"],
    ["pri-plugin-command-build", "../built-in-plugins/command-build/index.js"],
    ["pri-plugin-command-init", "../built-in-plugins/command-init/index.js"],
    ["pri-plugin-command-preview", "../built-in-plugins/command-preview/index.js"],
    ["pri-plugin-command-plugin", "../built-in-plugins/command-plugin/index.js"],
    ["pri-plugin-command-test", "../built-in-plugins/command-test/index.js"],
    ["pri-plugin-project-analyse-config", "../built-in-plugins/project-analyse-config/index.js"],
    ["pri-plugin-project-analyse-layouts", "../built-in-plugins/project-analyse-layouts/index.js"],
    ["pri-plugin-project-analyse-markdown-layouts", "../built-in-plugins/project-analyse-markdown-layouts/index.js"],
    ["pri-plugin-project-analyse-markdown-pages", "../built-in-plugins/project-analyse-markdown-pages/index.js"],
    ["pri-plugin-project-analyse-not-found", "../built-in-plugins/project-analyse-not-found/index.js"],
    ["pri-plugin-project-analyse-pages", "../built-in-plugins/project-analyse-pages/index.js"],
    ["pri-plugin-white-files", "../built-in-plugins/white-files/index.js"],
    ["pri-plugin-ensure-project-files", "../built-in-plugins/ensure-project-files/index.js"],
    ["pri-plugin-service-worker", "../built-in-plugins/service-worker/index.js"],
    ["pri-plugin-mocks", "../built-in-plugins/mocks/index.js"],
    ["pri-plugin-cache-bundle-thunks", "../built-in-plugins/cache-bundle-thunks/index.js"],
    ["pri-plugin-client-ssr", "../built-in-plugins/client-ssr/index.js"]
  ]

  return plugins.reduce((obj: any, right) => {
    obj[right[0]] = "file:" + path.relative(projectRootPath, path.join(__dirname, right[1]))
    return obj
  }, {})
}

export interface ICommand {
  name?: string
  description?: string
  beforeAction?: any
  action?: any
  afterAction?: any
  isDefault?: boolean
  options?: string[][]
}

export type IAnalyseProject = (
  projectFilesParsedPaths?: Array<path.ParsedPath & { isDir: boolean }>,
  env?: "local" | "prod",
  projectConfig?: IProjectConfig,
  setPipe?: typeof set
) => any

export type ICreateEntry = (
  analyseInfo?: any,
  entry?: Entry,
  env?: "local" | "prod",
  projectConfig?: IProjectConfig
) => void

export type IBuildConfigPipe = (env: "local" | "prod", config: webpack.Configuration) => webpack.Configuration

export type ILoaderOptionsPipe = (env: "local" | "prod", options: any) => any

export type IAfterProdBuild = (stats?: any, projectConfig?: IProjectConfig) => any

let hasInitPlugins = false

export type IWhiteFile = (file: path.ParsedPath & { isDir: boolean }) => boolean

export interface IEnsureProjectFilesQueue {
  fileName: string
  pipeContent: (prev?: string) => string
}

export class IPluginConfig {
  public analyseInfo?: any = {}

  public commands?: ICommand[] = []

  public buildConfigPipes: IBuildConfigPipe[] = []
  public buildConfigStyleLoaderOptionsPipes: ILoaderOptionsPipe[] = []
  public buildConfigCssLoaderOptionsPipes: ILoaderOptionsPipe[] = []
  public buildConfigSassLoaderOptionsPipes: ILoaderOptionsPipe[] = []
  public buildConfigLessLoaderOptionsPipes: ILoaderOptionsPipe[] = []
  public buildConfigBabelLoaderOptionsPipes: ILoaderOptionsPipe[] = []
  public buildConfigTsLoaderOptionsPipes: ILoaderOptionsPipe[] = []

  public buildAfterProdBuild: IAfterProdBuild[] = []

  public projectAnalyses: IAnalyseProject[] = []

  public projectCreateEntrys: ICreateEntry[] = []

  public whiteFileRules: IWhiteFile[] = []

  public ensureProjectFilesQueue: IEnsureProjectFilesQueue[] = []

  public devServices: { socketListeners: Array<{ name: string; callback: () => void }> } = { socketListeners: [] }
}

export const plugin: IPluginConfig = new IPluginConfig()

export const initPlugins = async (projectRootPath: string) => {
  if (hasInitPlugins) {
    return
  }
  hasInitPlugins = true

  const projectPackageJsonPath = path.join(projectRootPath, "package.json")

  const builtInPlugins = getBuiltInPlugins(projectRootPath)

  getPriPlugins(path.join(projectRootPath, "package.json"), builtInPlugins)

  if (loadedPlugins.size > 1) {
    for (const eachPlugin of getPluginsByOrder()) {
      await Promise.resolve(eachPlugin.instance(pri))
    }
  }
}

function getPriPlugins(packageJsonPath: string, extendPlugins: any = {}) {
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

  Object.keys(allDependencies)
    .filter(subPackageName => subPackageName.startsWith("pri-plugin") || subPackageName.startsWith("@ali/pri-plugin"))
    .map(subPackageName => {
      // Can't allowed same name plugins
      if (Array.from(loadedPlugins).some(loadedPlugin => loadedPlugin.name === subPackageName)) {
        throw Error(`There are two plugins named ${subPackageName}!`)
      }

      const subPackageVersion = allDependencies[subPackageName]
      const subPackageRealEntry = subPackageVersion.startsWith("file:")
        ? path.join(projectRootPath, subPackageVersion.replace(/^file\:/g, ""))
        : subPackageName

      const subPackageRealEntryFilePath = require.resolve(subPackageRealEntry, {
        paths: [__dirname, projectRootPath]
      })

      const subPackageAbsolutePath = getPackageJsonPathByPathOrNpmName(subPackageName, projectRootPath)

      const subPackageJson = fs.readJsonSync(subPackageAbsolutePath, { throws: false })
      const instance = getDefault(require(subPackageRealEntryFilePath))

      loadedPlugins.add({
        instance,
        pathOrModuleName: subPackageRealEntry,
        name: subPackageName,
        version: subPackageVersion,
        config: subPackageJson && subPackageJson.pri
      })

      if (subPackageAbsolutePath) {
        getPriPlugins(subPackageAbsolutePath)
      }
    })
}

export function getPluginsByOrder() {
  const instantiatedPluginNames = new Set<string>()
  const outputPlugins: IPluginPackageInfo[] = []

  // Check deps has been loaded
  loadedPlugins.forEach(loadedPlugin => {
    if (loadedPlugin.config && loadedPlugin.config.dependencies) {
      loadedPlugin.config.dependencies.forEach(depPluginName => {
        if (!Array.from(loadedPlugins).some(eachLoadedPlugin => eachLoadedPlugin.name === depPluginName)) {
          log(colors.red(`${loadedPlugin.name}: No dependent "${depPluginName}"`))
          log(colors.blue(`Try: npm install ${depPluginName}.`))
          process.exit(0)
        }
      })
    }
  })

  // Init plugins
  while (instantiatedPluginNames.size !== loadedPlugins.size) {
    const currentInstantiatedPlugins = getPluginWithPreloadDependences(Array.from(instantiatedPluginNames))
    currentInstantiatedPlugins.forEach(eachPlugin => outputPlugins.push(eachPlugin))

    if (currentInstantiatedPlugins.length === 0) {
      throw Error("Plug-in loop dependency.")
    }

    currentInstantiatedPlugins.forEach(eachPlugin => instantiatedPluginNames.add(eachPlugin.name))
  }

  return outputPlugins
}

function getPluginWithPreloadDependences(preInstantiatedDependences: string[]) {
  return (
    Array.from(loadedPlugins)
      // Filter plugins who are not instantiated.
      .filter(loadedPlugin => {
        if (preInstantiatedDependences.length === 0) {
          return true
        }

        return preInstantiatedDependences.findIndex(pluginName => loadedPlugin.name === pluginName) === -1
      })
      // Filter plugins who satisfied the dependence condition.
      .filter(loadedPlugin => {
        // No dependences obvious can pass.
        if (!loadedPlugin.config || !loadedPlugin.config.dependencies) {
          return true
        }
        if (
          loadedPlugin.config.dependencies.every(
            depPluginName => preInstantiatedDependences.indexOf(depPluginName) > -1
          )
        ) {
          return true
        }
        return false
      })
      .map(loadedPlugin => loadedPlugin)
  )
}

function getPackageJsonPathByPathOrNpmName(pathOrNpmName: string, projectRootPath: string) {
  try {
    return require.resolve(path.join(pathOrNpmName, "package.json"), { paths: [__dirname, projectRootPath] })
  } catch (error) {
    return null
  }
}
