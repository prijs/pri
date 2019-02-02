import * as React from 'react';

export class Props {
  public docs?: Array<{ name: string; element: any; text: string }> = [];
}

export class State {
  public currentDocIndex = 0;
  public showDocInfo = false;
}
