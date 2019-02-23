import { ProjectConfig } from './project-config-interface';

export class GlobalState {
  public projectRootPath: string;
  public projectConfig = new ProjectConfig();
  public priPackageJson: any;
  public projectPackageJson: {
    name?: string;
    version?: string;
    pri?: {
      /**
       * Project type
       */
      type: IProjectType;
    };
  } = {};
  /**
   * majorCommand
   * for example: pri dev -d, the major command is "dev"
   */
  public majorCommand: string;
  /**
   * Development enviroment.
   */
  public isDevelopment: boolean;
}

export type IProjectType = 'project' | 'component' | 'plugin' | null;
