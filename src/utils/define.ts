export interface IPackageJson {
  main: string;
  name: string;
  version: string;
  types?: string;
  typings?: string;
}

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

export type TransferedRegisterCommand = { childs?: TransferedRegisterCommand[] } & ICommandRegister;

export interface StructorConfig {
  dir: string;
  name?: string;
  ext?: string;
}

export type SourceType = 'Root' | string;
