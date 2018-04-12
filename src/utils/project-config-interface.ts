export class IProjectConfig {
  /**
   * Title for html <title>.
   */
  public title?: string = "pri"
  /**
   * Dist dir path.
   * Only take effect on `npm run build` | `pri build`.
   */
  public distDir?: string = "dist"
  /**
   * Dist main file name.
   * Only take effect on `npm run build` | `pri build`.
   */
  public distFileName?: string = "main"
  /**
   * Assets public path. `"https://www.some.com"`, `"https://www.some.com/somePath"`, `"/somePath"`.
   * If not set, result: `/<distPath>`.
   * If set /somePath for example, result: `/somePath/<distPath>`.
   * If set some.com for example, result: `https://www.some.com/<distPath>`.
   * If set some.com/somePath for example, result: `https://www.some.com/somePath/<distPath>`.
   * Only take effect on `npm run build` | `pri build`.
   */
  public publicPath?: string | null = null
  /**
   * Base href for all pages.
   * For example, `/admin` is the root path after deploy, you should set baseHref to `/admin`.
   * There is no need to modify the code, routing `/` can automatically maps to `/admin`.
   * Only take effect on `npm run build` | `pri build`
   */
  public baseHref?: string = "/"
  /**
   * Custom env.
   */
  public customEnv?: { [key: string]: any }
  /**
   * Using https for server.
   */
  public useHttps = true
}
