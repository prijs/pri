export declare class IProjectConfig {
    /**
     * Title for html <title>
     */
    title?: string;
    /**
     * Dist dir path
     * Only take effect on npm run build | pri build
     */
    distDir?: string;
    /**
     * Dist main file name
     * Only take effect on npm run build | pri build
     */
    distFileName?: string;
    /**
     * Assets public path. eg: some.com, some.com/somePath, /somePath
     * If not set, result: /<distPath>
     * If set /somePath for example, result: /somePath/<distPath>
     * If set some.com for example, result: //some.com/<distPath>
     * If set some.com/somePath for example, result: //some.com/somePath/<distPath>
     * Only take effect on npm run build | pri build
     */
    publicPath?: string | null;
    /**
     * Base href for all pages.
     * For example, /admin is the root path after deploy, you should set baseHref to /admin.
     * There is no need to modify the code, routing / can automatically maps to /admin.
     * Only take effect on npm run build | pri build
     */
    baseHref?: string;
    /**
     * Generate static index file for each route, when building.
     * Usefal for static service who don't serve fallback html, like github-pages.
     * Only take effect on npm run build | pri build
     */
    staticBuild: boolean;
    /**
     * Custom env
     */
    env?: {
        [key: string]: any;
    };
}
