export class IProjectInfo {
  public routes: Array<{
    path: string
    filePath: string
    isIndex: boolean
  }> = []
  public layout: {
    filePath: string
  } | null = null
  public notFound: {
    filePath: string
  } | null = null
  public hasConfigFile = false
  public hasLayoutFile = false
  public has404File = false
}