import * as React from 'react';
import { pri } from '../../../../../../node';
import * as io from 'socket.io-client';
import { IProjectStatus } from '../../server/project-status-interface';
import { MainComponent } from './main/main';
import { MenuComponent } from './menu/menu';
import { NavComponent } from './nav';
import { StructComponent } from './struct/struct.component';
import { ApplicationContext } from '../stores';
import { loadPluginsByPosition } from '../utils/functional';
import { SocketContext } from '../utils/context';

const topContainerStyle: React.CSSProperties = { display: 'flex', height: 40, borderBottom: '1px solid #eee' };

const bottomContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  flexBasis: 0,
};

export const LayoutComponent = React.memo(() => {
  const [state, dispatch] = React.useContext(ApplicationContext);
  const socket = React.useRef<SocketIOClient.Socket>(null);

  React.useEffect(() => {
    socket.current = io(`//${pri.sourceConfig.devHost || 'localhost'}:${(window as any).serverPort}`);

    // Get init project status
    socket.current.emit('getProjectStatus');

    socket.current.on('freshProjectStatus', (data: IProjectStatus) => {
      dispatch({
        type: 'freshProjectStatus',
        status: data,
      });
    });

    socket.current.on('changeFile', () => {
      //
    });

    return () => {
      socket.current.disconnect();
    };
  }, [dispatch]);

  return (
    <SocketContext.Provider value={socket.current}>
      <div style={{ display: 'flex', height: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 250,
            borderRight: '1px solid #eee',
          }}
        >
          <div style={topContainerStyle}>
            <NavComponent />
          </div>

          <div style={bottomContainerStyle}>
            <StructComponent />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            flexBasis: 0,
          }}
        >
          <div style={topContainerStyle}>
            <MenuComponent />
            {loadPluginsByPosition(state.plugins, 'menu')}
          </div>

          <div style={bottomContainerStyle}>
            <MainComponent />
          </div>
        </div>
      </div>
    </SocketContext.Provider>
  );
});
