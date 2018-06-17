import * as React from 'react';

export class Props {
  public docs?: Array<{ name: string; element: any }> = [];
}

export class State {
  public currentDocIndex = 0;
}
