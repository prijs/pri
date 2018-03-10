import * as fs from "fs-extra"
import { flatten } from "lodash"
import * as path from "path"
import * as webpack from "webpack"
import { getDefault } from "./esModule"

let hasInitPlugins = false

export class IPluginConfig {
  public commands?: Array<{
    name?: string
    description?: string
    action?: () => void
  }> = []

  public webpackConfig: webpack.Configuration = {}
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

  if (!fs.existsSync(projectPackageJsonPath)) {
    return
  }

  getPriPlugins(path.join(projectRootPath, "package.json")).forEach(eachPlugin => pluginPackages.push(eachPlugin))
}

function getPriPlugins(packageJsonPath: string): IPluginPackageInfo[] {
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
        const instance = getDefault(require(subPackageRealEntry))

        return [{
          instance,
          name: subPackageName,
          version: subPackageVersion
        }, ...getPriPlugins(subPackageAbsolutePath)]
      })
  )
}
