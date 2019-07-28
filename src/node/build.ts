import { plugin } from '../utils/plugins';
import {
  IAfterProdBuild,
  IBuildConfigPipe,
  ILoaderExcludePipe,
  ILoaderIncludePipe,
  ILoaderOptionsPipe,
} from '../utils/define';

export const pipeConfig = (pipe: IBuildConfigPipe) => {
  plugin.buildConfigPipes.push(pipe);
};

export const pipeBundleConfig = (pipe: IBuildConfigPipe) => {
  plugin.bundleConfigPipes.push(pipe);
};

export const pipeStyleLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigStyleLoaderOptionsPipes.push(pipe);
};

export const pipeCssLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigCssLoaderOptionsPipes.push(pipe);
};

export const pipeSassLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigSassLoaderOptionsPipes.push(pipe);
};

export const pipeLessLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigLessLoaderOptionsPipes.push(pipe);
};

export const pipeBabelLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigBabelLoaderOptionsPipes.push(pipe);
};

export const pipeJsInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigJsLoaderIncludePipes.push(pipe);
};

export const pipeSassInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigSassLoaderIncludePipes.push(pipe);
};

export const pipeLessInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigLessLoaderIncludePipes.push(pipe);
};

export const pipeSassExclude = (pipe: ILoaderExcludePipe) => {
  plugin.buildConfigSassLoaderExcludePipes.push(pipe);
};

export const pipeLessExclude = (pipe: ILoaderExcludePipe) => {
  plugin.buildConfigLessLoaderExcludePipes.push(pipe);
};

export const afterProdBuild = (callback: IAfterProdBuild) => {
  plugin.buildAfterProdBuild.push(callback);
};
