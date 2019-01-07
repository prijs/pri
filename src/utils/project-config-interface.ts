interface IRoute {
  path: string;
  component: string;
}

export class ProjectConfig {
  /**
   * Title for html <title>.
   */
  public title?: string = null;
  /**
   * Dev server port, when execute npm start.
   */
  public devPort?: number = null;
  /**
   * Output main file name.
   */
  public outFileName?: string = 'main.[hash].js';
  /**
   * Output main css file name.
   */
  public outCssFileName?: string = 'main.[hash].css';
  /**
   * Bundle file name
   */
  public bundleFileName?: string = 'bundle.js';
  /**
   * Specify the development url, work both for `npm start` and `npm run preview`.
   * In most scenes, it should not be configured.
   * > Conflict with `devPort`
   */
  public devUrl?: string = null;
  /**
   * Dist dir path.
   * Only take effect on `npm run build` | `pri build`.
   */
  public distDir?: string = 'dist';
  /**
   * Assets public path. `"https://www.some.com"`, `"https://www.some.com/somePath"`, `"/somePath"`.
   * If not set, result: `/<distPath>`.
   * If set /somePath for example, result: `/somePath/<distPath>`.
   * If set some.com for example, result: `https://www.some.com/<distPath>`.
   * If set some.com/somePath for example, result: `https://www.some.com/somePath/<distPath>`.
   * Only take effect on `npm run build` | `pri build`.
   */
  public publicPath?: string = '/';
  /**
   * Base href for all pages.
   * For example, `/admin` is the root path after deploy, you should set baseHref to `/admin`.
   * There is no need to modify the code, routing `/` can automatically maps to `/admin`.
   * Only take effect on `npm run build` | `pri build`
   */
  public baseHref?: string = '/';
  /**
   * Custom env.
   */
  public customEnv?: { [key: string]: any };
  /**
   * Using https for server.
   */
  public useHttps?: boolean = true;
  /**
   * Use service worker
   * Warning: if disable it, mocks, prefetch, serverRender will become invalid.
   */
  public useServiceWorker?: boolean = false;
  /**
   * Client server render
   * Warning: depend on service worker, should set useServiceWorker=true first.
   */
  public clientServerRender?: boolean = false;
  /**
   * Custom routes. When this configuration exists, it will not parse the `pages` directory.
   */
  public routes?: IRoute[] = [];
  /**
   * Enable hash router.
   */
  public useHashRouter?: boolean = false;
  /**
   * Specify source file root path, for example `sourceRoot='app/client'`, will lead to `app/client/src` and `app/client/tests`.
   */
  public sourceRoot?: string = './';
  /**
   * Suggestion to open!
   */
  public unexpectedFileCheck?: boolean = true;
  /**
   * Enable package lock.
   */
  public packageLock?: boolean = false;
  /**
   * Hide source code when publish npm package.
   * Only take effect on `projectType = component`.
   */
  public hideSourceCodeForNpm?: boolean = false;
}
