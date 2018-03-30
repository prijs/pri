import { lint as basicLint } from "../../utils/tslint"
import { getProjectRootPath } from "./get-project-root-path"

const lint = basicLint.bind(null, getProjectRootPath())

export { lint }
