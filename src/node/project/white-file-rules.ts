import * as path from "path"
import { IWhiteFile, plugin } from "../../utils/plugins"

export function add(opts: IWhiteFile) {
  plugin.whiteFileRules.push(opts)
}
