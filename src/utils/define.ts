import * as path from 'path';
import { Configuration } from 'webpack';
import { Entry } from './create-entry';

export interface PackageJson {
  main: string;
  name: string;
  version: string;
  types?: string;
  typings?: string;
}

export interface CommandRegister<
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

export type TransferedRegisterCommand = { childs?: TransferedRegisterCommand[] } & CommandRegister;

export interface StructorConfig {
  dir: string;
  name?: string;
  ext?: string;
}

export type SourceType = 'root' | string;

export type ProjectType = 'project' | 'component' | 'plugin' | null;

export interface PackageInfo {
  name: string;
  rootPath: string;
  packageJson: PackageJson;
  config: ProjectConfig;
}

interface CustomRoute {
  path: string;
  component: string;
}

export type PipeCallback = (text: string) => string | Promise<string>;

export class ProjectInfo {
  public routes: {
    path: string;
    filePath: string;
    isIndex: boolean;
  }[] = [];

  public hasConfigFile = false;

  public hasLayout = false;

  public has404File = false;

  public stores: {
    filePath: string;
    name: string;
  }[] = [];
}

/**
 * Types for globalState
 */
export class GlobalState {
  public projectRootPath: string;

  public projectConfig: ProjectConfig;

  /**
   * Selected source type.
   * 'root' or some packages.
   */
  public selectedSourceType: SourceType = 'root';

  /**
   * In most cases, sourceRoot path is equal to projectRootPath.
   * One exception is run source code in sub packages.
   */
  public sourceRoot: string;

  /**
   * Project config in currnet source.
   */
  public sourceConfig: ProjectConfig;

  public priPackageJson: Partial<PackageJson>;

  public projectPackageJson: Partial<PackageJson> = {};

  /**
   * majorCommand
   * for example: pri dev -d, the major command is "dev"
   */
  public majorCommand: string;

  /**
   * Development enviroment.
   */
  public isDevelopment: boolean = false;

  /**
   * packages info
   */
  public packages: PackageInfo[] = [];
}

/**
 * Types for priconfig.json
 */
export class ProjectConfig {
  /**
   * Project type
   */
  public type?: ProjectType;

  /**
   * Title for html <title>.
   */
  public title?: string = null;

  /**
   * Dev server port, when execute npm start.
   */
  public devPort?: number = null;

  /**
   * Output main file name.
   */
  public outFileName?: string = 'index.js';

  /**
   * Output main css file name.
   */
  public outCssFileName?: string = 'index.css';

  /**
   * Css extract.
   */
  public cssExtract?: boolean = false;

  /**
   * Bundle file name
   */
  public bundleFileName?: string = 'bundle.js';

  /**
   * Specify the development url, work both for `npm start` and `npm run preview`.
   * In most scenes, it should not be configured.
   * > Conflict with `devPort`
   */
  public devUrl?: string = null;

  /**
   * Dist dir path.
   * Only take effect on `npm run build` | `pri build`.
   */
  public distDir?: string = 'dist';

  /**
   * Assets public path. `"https://www.some.com"`, `"https://www.some.com/somePath"`, `"/somePath"`.
   * If not set, result: `/<distPath>`.
   * If set /somePath for example, result: `/somePath/<distPath>`.
   * If set some.com for example, result: `https://www.some.com/<distPath>`.
   * If set some.com/somePath for example, result: `https://www.some.com/somePath/<distPath>`.
   * Only take effect on `npm run build` | `pri build`.
   */
  public publicPath?: string = '/';

  /**
   * Base href for all pages.
   * For example, `/admin` is the root path after deploy, you should set baseHref to `/admin`.
   * There is no need to modify the code, routing `/` can automatically maps to `/admin`.
   * Only take effect on `npm run build` | `pri build`
   */
  public baseHref?: string = '/';

  /**
   * Custom env.
   */
  public customEnv?: { [key: string]: any };

  /**
   * Using https for server.
   */
  public useHttps?: boolean = true;

  /**
   * Use service worker
   * Warning: if disable it, mocks, prefetch, serverRender will become invalid.
   */
  public useServiceWorker?: boolean = false;

  /**
   * Client server render
   * Warning: depend on service worker, should set useServiceWorker=true first.
   */
  public clientServerRender?: boolean = false;

  /**
   * Custom routes. When this configuration exists, it will not parse the `pages` directory.
   */
  public routes?: CustomRoute[] = [];

  /**
   * Enable hash router.
   */
  public useHashRouter?: boolean = false;

  /**
   * Suggestion to open!
   */
  public unexpectedFileCheck?: boolean = true;

  /**
   * Enable package lock.
   */
  public packageLock?: boolean = false;

  /**
   * Hide source code when publish npm package.
   * Only take effect on `projectType = component`.
   */
  public hideSourceCodeForNpm?: boolean = false;

  /**
   * Watch node_modules
   */
  public watchNodeModules?: boolean = false;

  /**
   * Check deps * ^ ~
   */
  public allowDepsSemver?: 'major' | 'minor' | 'patch' | 'fixed' = null;
}

export type SetPipe = (pipeName: string, callback: PipeCallback) => void;

export type IAnalyseProject = (
  projectFilesParsedPaths?: (path.ParsedPath & { isDir: boolean })[],
  setPipe?: SetPipe
) => any;

export type ICreateEntry = (analyseInfo?: any, entry?: Entry) => void;

export type IBuildConfigPipe = (config: Configuration) => Configuration | Promise<Configuration>;

export type ILoaderOptionsPipe = (options: any) => any;
export type ILoaderIncludePipe = (paths: (string | RegExp)[]) => any;
export type ILoaderExcludePipe = (paths: (string | RegExp)[]) => any;

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
  getUIPlugins?: () => Promise<any>[];
}
