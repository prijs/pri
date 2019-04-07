export class Props {
  public docs?: { name: string; element: any; text: string }[] = [];
}

export class State {
  public currentDocIndex = 0;

  public showDocInfo = false;
}
