import * as fs from "fs-extra"
import { flatten } from "lodash"
import * as path from "path"
import * as webpack from "webpack"
import { getDefault } from "./esModule"

let hasInitPlugins = false

interface IPlugin {
  commands?: Array<{
    name?: string
    description?: string
    action?: () => void
  }>

  buildConfig?: (config: webpack.Configuration) => webpack.Configuration
}

export interface IPluginInfo {
  name: string
  version: string
  instance: IPlugin
}

const plugins: IPluginInfo[] = []

const initPlugins = (projectRootPath: string) => {
  const projectPackageJsonPath = path.join(projectRootPath, "package.json")

  if (!fs.existsSync(projectPackageJsonPath)) {
    return
  }

  getPriPlugins(path.join(projectRootPath, "package.json")).forEach(plugin => plugins.push(plugin))
}

function getPriPlugins(packageJsonPath: string): IPluginInfo[] {
  const projectRootPath = path.resolve(packageJsonPath, "..")

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const packageJson = fs.readJSONSync(packageJsonPath)
  const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

  return flatten(
    Object.keys(allDependencies)
      .filter(subPackageName => subPackageName.startsWith("pri-plugin"))
      .map(subPackageName => {
        const subPackageVersion = allDependencies[subPackageName]
        const subPackageRealEntry = subPackageVersion.startsWith("file:") ?
          path.join(projectRootPath, subPackageVersion.replace(/^file\:/g, "")) :
          subPackageName
        const subPackageAbsolutePath = require.resolve(path.join(path.join(subPackageRealEntry), "package.json"))
        const plugin: IPlugin = require(subPackageRealEntry)

        return [{
          name: subPackageName,
          version: subPackageVersion,
          instance: getDefault(plugin)
        }, ...getPriPlugins(subPackageAbsolutePath)]
      })
  )
}

export function getPlugins(projectRootPath: string) {
  if (!hasInitPlugins) {
    initPlugins(projectRootPath)
    hasInitPlugins = true
  }

  return plugins
}
