import * as webpack from "webpack"
import { plugin } from "../utils/plugins"

export const pipeConfig = (
  pipe: (config: webpack.Configuration) => webpack.Configuration
) => {
  plugin.buildConfigPipes.push(pipe)
}
