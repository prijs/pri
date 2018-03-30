import { IAnalyseProject, ICreateEntry, plugin } from "../../utils/plugins"
import { checkProjectFiles } from "./check-project-files"
import { getProjectConfig } from "./get-project-config"
import { getProjectRootPath } from "./get-project-root-path"
import { lint } from "./lint"
import * as whiteFileRules from "./white-file-rules"

export { onEnsureProjectFiles, ensureProjectFiles } from "./on-ensure-project-files"

/**
 * Each time, scan this project's files.
 */
export const onAnalyseProject = (fn: IAnalyseProject) => {
  plugin.projectAnalyses.push(fn)
}

export const onCreateEntry = (fn: ICreateEntry) => {
  plugin.projectCreateEntrys.push(fn)
}

export { whiteFileRules }
export { lint }
export { getProjectRootPath }
export { getProjectConfig }
export { checkProjectFiles }
