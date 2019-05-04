import { ProjectConfig } from './project-config-interface';
import { IPackageJson, SourceType } from './define';

export class GlobalState {
  public projectRootPath: string;

  public projectConfig: ProjectConfig;

  /**
   * Selected source type.
   * Root or some packages.
   */
  public selectedSourceType: SourceType = 'Root';

  /**
   * In most cases, sourceRoot path is equal to projectRootPath.
   * One exception is run source code in sub packages.
   */
  public sourceRoot: string;

  /**
   * Project config in currnet source.
   */
  public sourceConfig: ProjectConfig;

  public priPackageJson: Partial<IPackageJson>;

  public projectPackageJson: Partial<IPackageJson> = {};

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
  public packages: Package[] = [];
}

export type IProjectType = 'project' | 'component' | 'plugin' | null;

export interface Package {
  name: string;
  rootPath: string;
  packageJson: IPackageJson;
  config: ProjectConfig;
}
