import { ProjectConfig } from './project-config-interface';
export declare class GlobalState {
    projectRootPath: string;
    projectConfig: ProjectConfig;
    priPackageJson: any;
    projectPackageJson: {
        name?: string;
        version?: string;
        pri?: {
            /**
             * Project type
             */
            type: IProjectType;
        };
    };
    /**
     * majorCommand
     * for example: pri dev -d, the major command is "dev"
     */
    majorCommand: string;
    /**
     * Development enviroment.
     */
    isDevelopment: boolean;
}
export declare type IProjectType = 'project' | 'component' | 'plugin' | null;
