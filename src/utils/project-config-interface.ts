export class IConfig {
  /**
   * Title for html <title>
   */
  public title?: string = "pri"
  /**
   * Dist dir path when running: npm run build | pri build
   */
  public distDir?: string = "dist"
  /**
   * Public url path when running: npm run build | pri build
   */
  public publicPath?: string | null = null
  /**
   * Custom env
   */
  public env?: {
    [key: string]: any
  }
}
