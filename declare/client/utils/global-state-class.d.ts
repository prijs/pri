import { ProjectConfig } from './project-config-interface';
export declare class GlobalState {
    projectRootPath: string;
    projectConfig: ProjectConfig;
    priPackageJson: any;
    projectPackageJson: {
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
