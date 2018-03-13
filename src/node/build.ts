import * as webpack from "webpack"
import { IBuildConfigPipe, plugin } from "../utils/plugins"

export const pipeConfig = (pipe: IBuildConfigPipe) => {
  plugin.buildConfigPipes.push(pipe)
}
