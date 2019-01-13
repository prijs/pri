import { Connect } from 'dob-react';
import * as React from 'react';
import { PureComponent } from '../../utils/react-helper';
import { Props, State } from './nav.type';

@Connect
export class NavComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props();
  public state = new State();

  public render() {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexGrow: 1,
          paddingLeft: 10,
          paddingRight: 10,
          fontWeight: 'bold',
          color: '#999'
        }}
      >
        <span>Pri dashboard</span>
        <a style={{ marginLeft: 5 }} href="https://github.com/prijs/pri" target="_blank">
          Docs
        </a>
      </div>
    );
  }
}
