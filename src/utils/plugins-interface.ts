import * as path from 'path';
import { Configuration } from 'webpack';
import { set } from '../node/pipe';
import { Entry } from './create-entry';

export interface ICommandRegister<
  T = {
    [optionName: string]: {
      alias?: string;
      description?: string;
      required?: boolean;
    };
  }
> {
  name: string[];
  // TODO:
  action?: (options?: any) => void;
  beforeAction?: any;
  afterAction?: any;
  alias?: string | string[];
  description?: string;
  options?: T;
}

export type IDevDllList = (list: string[]) => string[];

export type IAnalyseProject = (
  projectFilesParsedPaths?: Array<path.ParsedPath & { isDir: boolean }>,
  setPipe?: typeof set
) => any;

export type ICreateEntry = (analyseInfo?: any, entry?: Entry) => void;

export type IBuildConfigPipe = (config: Configuration) => Configuration | Promise<Configuration>;

export type ILoaderOptionsPipe = (options: any) => any;
export type ILoaderIncludePipe = (paths: Array<string | RegExp>) => any;
export type ILoaderExcludePipe = (paths: Array<string | RegExp>) => any;

export type IAfterProdBuild = (stats?: any) => any;

export type IWhiteFile = (file: path.ParsedPath & { isDir: boolean }) => boolean;

export interface IEnsureProjectFilesQueue {
  fileName: string;
  pipeContent: (prev?: string) => string | Promise<string>;
}

export type ILintFilter = (filePath?: string) => boolean;

export interface IPluginModule {
  getConfig?: () => {
    // Plugin name
    name: string;
    // Dependent plugin names
    dependencies?: string[];
  };
  getPlugin?: () => Promise<any>;
  getUIPlugins?: () => Array<Promise<any>>;
}
