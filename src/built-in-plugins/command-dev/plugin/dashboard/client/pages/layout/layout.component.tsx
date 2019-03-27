import { Connect } from 'dob-react';
import * as React from 'react';
import { Props, State } from './layout.type';

import { PureComponent } from '../../utils/react-helper';
import { MainComponent } from '../main/main.component';
import { MenuComponent } from '../menu/menu.component';
import { NavComponent } from '../nav/nav.component';
import { StructComponent } from '../struct/struct.component';

@Connect
export class LayoutComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props();

  public state = new State();

  public componentDidMount() {
    this.props.ApplicationAction.initSocket();
  }

  public render() {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 250, borderRight: '1px solid #eee' }}>
          <div style={topContainerStyle}>
            <NavComponent />
          </div>

          <div style={bottomContainerStyle}>
            <StructComponent />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
          <div style={topContainerStyle}>
            <MenuComponent />
            {this.props.ApplicationAction.loadPluginsByPosition('menu')}
          </div>

          <div style={bottomContainerStyle}>
            <MainComponent />
          </div>
        </div>
      </div>
    );
  }
}

const topContainerStyle: React.CSSProperties = { display: 'flex', height: 40, borderBottom: '1px solid #eee' };

const bottomContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  flexBasis: 0
};
