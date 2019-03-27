export class IProjectInfo {
  public routes: {
    path: string;
    filePath: string;
    isIndex: boolean;
  }[] = [];

  public hasConfigFile = false;

  public hasLayout = false;

  public has404File = false;

  public stores: {
    filePath: string;
    name: string;
  }[] = [];
}
