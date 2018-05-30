export class IProjectInfo {
  public routes: Array<{
    path: string;
    filePath: string;
    isIndex: boolean;
  }> = [];
  public hasConfigFile = false;
  public hasLayout = false;
  public has404File = false;
  public hasMarkdownLayout = false;
  public stores: Array<{
    filePath: string;
    name: string;
  }> = [];
}
