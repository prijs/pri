import { Connect } from 'dob-react';
import * as React from 'react';
import { PureComponent } from '../../utils/react-helper';
import { Props, State } from './menu.type';

import { NewPageComponent } from './new-page/new-page.component';

@Connect
export class MenuComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props();
  public state = new State();

  public componentDidMount() {
    this.props.ApplicationAction.initSocket();
  }

  public render() {
    return (
      <div style={{ display: 'flex' }}>
        <NewPageComponent />
      </div>
    );
  }
}
