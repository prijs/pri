import { ProjectConfig } from './project-config-interface';

export class GlobalState {
  public projectRootPath: string;
  public projectConfig = new ProjectConfig();
  public priPackageJson: any;
  public projectPackageJson: {
    pri?: {
      /**
       * Project type
       */
      type: 'project' | 'component' | 'plugin' | 'cli' | null;
      /**
       * Current used pri version
       */
      version: string;
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
