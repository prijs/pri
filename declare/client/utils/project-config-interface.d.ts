export declare class IProjectConfig {
    /**
     * Title for html <title>.
     */
    title?: string;
    /**
     * Dist dir path.
     * Only take effect on `npm run build` | `pri build`.
     */
    distDir?: string;
    /**
     * Dist main file name.
     * Only take effect on `npm run build` | `pri build`.
     */
    distFileName?: string;
    /**
     * Assets public path. `"https://www.some.com"`, `"https://www.some.com/somePath"`, `"/somePath"`.
     * If not set, result: `/<distPath>`.
     * If set /somePath for example, result: `/somePath/<distPath>`.
     * If set some.com for example, result: `https://www.some.com/<distPath>`.
     * If set some.com/somePath for example, result: `https://www.some.com/somePath/<distPath>`.
     * Only take effect on `npm run build` | `pri build`.
     */
    publicPath?: string | null;
    /**
     * Base href for all pages.
     * For example, `/admin` is the root path after deploy, you should set baseHref to `/admin`.
     * There is no need to modify the code, routing `/` can automatically maps to `/admin`.
     * Only take effect on `npm run build` | `pri build`
     */
    baseHref?: string;
    /**
     * Custom env.
     */
    customEnv?: {
        [key: string]: any;
    };
    /**
     * Using https for server.
     */
    useHttps: boolean;
}
