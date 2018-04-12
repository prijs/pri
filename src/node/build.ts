import * as webpack from "webpack"
import { IBuildConfigPipe, ILoaderOptionsPipe, plugin } from "../utils/plugins"

export const pipeConfig = (pipe: IBuildConfigPipe) => {
  plugin.buildConfigPipes.push(pipe)
}

export const pipeStyleLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigStyleLoaderOptionsPipes.push(pipe)
}

export const pipeCssLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigCssLoaderOptionsPipes.push(pipe)
}

export const pipeSassLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigSassLoaderOptionsPipes.push(pipe)
}

export const pipeLessLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigLessLoaderOptionsPipes.push(pipe)
}

export const pipeBabelLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigBabelLoaderOptionsPipes.push(pipe)
}

export const pipeTsLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigTsLoaderOptionsPipes.push(pipe)
}
