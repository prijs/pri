import { ProjectConfig } from "./project-config-interface";

export class GlobalState {
  public projectRootPath: string;
  public projectConfig: ProjectConfig;
  /**
   * majorCommand
   * for example: pri dev -d, the major command is "dev"
   */
  public majorCommand: string;
  /**
   * Development enviroment.
   */
  public isDevelopment: boolean;
  /**
   * Project type
   */
  public projectType: 'project' | 'component' | 'plugin' | null;
}
