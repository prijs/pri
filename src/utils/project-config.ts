import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as ts from "typescript"
import { exec } from "./exec"
import { findNearestNodemodules } from "./npm-finder"
import { IConfig } from "./project-config-interface"

export const getConfig = (projectRootPath: string, env: "local" | "prod" | null) => {
  const defaultConfig = new IConfig()

  const projectDefaultConfig = execTsByPath(path.join(projectRootPath, "src/config/config.default"))
  let projectEnvConfig = null

  switch (env) {
    case "local":
      projectEnvConfig = execTsByPath(path.join(projectRootPath, "src/config/config.local"))
      break
    case "prod":
      projectEnvConfig = execTsByPath(path.join(projectRootPath, "src/config/config.prod"))
      break
    default:
  }

  const finalConfig: IConfig = { ...defaultConfig, ...projectDefaultConfig, ...projectEnvConfig }

  return finalConfig
}

function execTsByPath(filePathWithoutExt: string) {
  let filePath = ""

  if (fs.existsSync(filePathWithoutExt + ".ts")) {
    filePath = filePathWithoutExt + ".ts"
  } else if (fs.existsSync(filePathWithoutExt + ".tsx")) {
    filePath = filePathWithoutExt + ".tsx"
  } else {
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
