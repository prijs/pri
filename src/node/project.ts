import { IAnalyseProject, plugin } from "../utils/plugins"
import { getConfig as getProjectConfig } from "../utils/project-config"

const projectRootPath = process.cwd()

/**
 * Each time, scan this project's files.
 */
export const onAnalyseProject = (fn: IAnalyseProject) => {
  plugin.projectAnalyses.push(fn)
}

export const getConfig = (env: "local" | "prod") => {
  return getProjectConfig(projectRootPath, env)
}

export const getProjectRootPath = () => projectRootPath
