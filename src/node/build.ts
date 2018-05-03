import * as webpack from "webpack"
import { IAfterProdBuild, IBuildConfigPipe, ILoaderIncludePipe, ILoaderOptionsPipe, plugin } from "../utils/plugins"

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

export const pipeTsInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigTsLoaderIncludePipes.push(pipe)
}

export const pipeSassInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigSassLoaderIncludePipes.push(pipe)
}

export const pipeLessInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigLessLoaderIncludePipes.push(pipe)
}

export const afterProdBuild = (callback: IAfterProdBuild) => {
  plugin.buildAfterProdBuild.push(callback)
}
