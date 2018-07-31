import { ProjectConfig } from "./project-config-interface";
export declare class GlobalState {
    projectRootPath: string;
    projectConfig: ProjectConfig;
    /**
     * majorCommand
     * for example: pri dev -d, the major command is "dev"
     */
    majorCommand: string;
    /**
     * Development enviroment.
     */
    isDevelopment: boolean;
    /**
     * Project type
     */
    projectType: 'project' | 'component' | 'plugin' | null;
}
