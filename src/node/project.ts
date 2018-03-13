import { IAnalyseProject, plugin } from "../utils/plugins"
import { getConfig as getProjectConfig } from "../utils/project-config"

const projectRootPath = process.cwd()

export const onAnalyseProject = (fn: IAnalyseProject) => {
  plugin.projectAnalyses.push(fn)
}

export const pipeAnalyse = () => {
  //
}

export const getConfig = (env: "local" | "prod") => {
  return getProjectConfig(projectRootPath, env)
}

export const getProjectRootPath = () => projectRootPath
