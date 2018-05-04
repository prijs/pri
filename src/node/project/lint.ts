import { ILintFilter, plugin } from "../../utils/plugins"
import { lint as basicLint } from "../../utils/tslint"
import { getProjectRootPath } from "./get-project-root-path"

const lint = basicLint.bind(null, getProjectRootPath())

export { lint }

export const lintFilter = (callback: ILintFilter) => {
  plugin.lintFilters.push(callback)
}
