import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as ts from "typescript"
import { exec } from "./exec"
import { findNearestNodemodules } from "./npm-finder"
import { IProjectConfig } from "./project-config-interface"
import { configPaths } from "./structor-config"

export const getConfig = (projectRootPath: string, env: "local" | "prod" | null) => {
  const defaultConfig = new IProjectConfig()

  const projectDefaultConfig = execTsByPath(path.join(projectRootPath, path.format(configPaths.default)))
  let projectEnvConfig = null

  switch (env) {
    case "local":
      projectEnvConfig = execTsByPath(path.join(projectRootPath, path.format(configPaths.local)))
      break
    case "prod":
      projectEnvConfig = execTsByPath(path.join(projectRootPath, path.format(configPaths.prod)))
      break
    default:
  }

  const finalConfig: IProjectConfig = { ...defaultConfig, ...projectDefaultConfig, ...projectEnvConfig }

  return finalConfig
}

function execTsByPath(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContent = fs.readFileSync(filePath).toString()
  const jsTransferContent = ts.transpile(fileContent)

  try {
    // tslint:disable-next-line:no-eval
    return eval(jsTransferContent)
  } catch (error) {
    throw Error(`Parse file ${error.toString()} in ${filePath}`)
  }
}
