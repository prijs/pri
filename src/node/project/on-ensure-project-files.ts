import { ensureFiles } from "../../utils/ensure-files"
import { IEnsureProjectFilesCallbackQueue, plugin } from "../../utils/plugins"
import { IProjectConfig } from "../../utils/project-config-interface"
import { getProjectRootPath } from "./get-project-root-path"

const projectRootPath = getProjectRootPath()

export function onEnsureProjectFiles(callback: IEnsureProjectFilesCallbackQueue) {
  plugin.ensureProjectFilesCallbackQueue.push(callback)
}

/**
 * Trigger ensure project files
 */
export async function ensureProjectFiles(projectConfig: IProjectConfig) {
  await ensureFiles(projectRootPath, projectConfig)
}
