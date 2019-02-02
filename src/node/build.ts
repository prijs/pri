import { plugin } from '../utils/plugins';
import {
  IAfterProdBuild,
  IBuildConfigPipe,
  IDevDllList,
  ILoaderExcludePipe,
  ILoaderIncludePipe,
  ILoaderOptionsPipe
} from '../utils/plugins-interface';

export const pipeConfig = (pipe: IBuildConfigPipe) => {
  plugin.buildConfigPipes.push(pipe);
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

export const pipeTsLoaderOptions = (pipe: ILoaderOptionsPipe) => {
  plugin.buildConfigTsLoaderOptionsPipes.push(pipe);
};

export const pipeTsInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigTsLoaderIncludePipes.push(pipe);
};

export const pipeSassInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigSassLoaderIncludePipes.push(pipe);
};

export const pipeLessInclude = (pipe: ILoaderIncludePipe) => {
  plugin.buildConfigLessLoaderIncludePipes.push(pipe);
};

export const pipeTsExclude = (pipe: ILoaderExcludePipe) => {
  plugin.buildConfigTsLoaderExcludePipes.push(pipe);
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

export const pipeDevDllList = (callback: IDevDllList) => {
  plugin.devDllPipes.push(callback);
};
