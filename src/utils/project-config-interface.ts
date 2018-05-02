export class IProjectConfig {
  /**
   * Title for html <title>.
   */
  public title?: string = "pri"
  /**
   * Dev server port, when execute npm start.
   */
  public devPort?: number = null
  /**
   * Output main file name.
   */
  public outFileName?: string = "main.[hash].js"
  /**
   * Output main css file name.
   */
  public outCssFileName?: string = "main.[hash].css"
  /**
   * Specify the development url, work both for `npm start` and `npm run preview`.
   * In most scenes, it should not be configured.
   * > Conflict with `devPort`
   */
  public devUrl?: string = null
  /**
   * Dist dir path.
   * Only take effect on `npm run build` | `pri build`.
   */
  public distDir?: string = "dist"
  /**
   * Assets public path. `"https://www.some.com"`, `"https://www.some.com/somePath"`, `"/somePath"`.
   * If not set, result: `/<distPath>`.
   * If set /somePath for example, result: `/somePath/<distPath>`.
   * If set some.com for example, result: `https://www.some.com/<distPath>`.
   * If set some.com/somePath for example, result: `https://www.some.com/somePath/<distPath>`.
   * Only take effect on `npm run build` | `pri build`.
   */
  public publicPath?: string = "/"
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
  /**
   * Use service worker
   * Warning: if disable it, mocks, prefetch, serverRender will become invalid.
   */
  public useServiceWorker = false
  /**
   * Client server render
   * Warning: depend on service worker, should set useServiceWorker=true first.
   */
  public clientServerRender = false
}
