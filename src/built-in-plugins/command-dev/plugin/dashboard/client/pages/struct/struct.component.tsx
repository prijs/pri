import { ListItem, List, ListItemText, ListItemSecondaryAction, Button } from '@material-ui/core';
import * as React from 'react';
import * as _ from 'lodash';
import { ApplicationContext } from '../../stores';
import { SocketContext } from '../../utils/context';

export const StructComponent = React.memo(() => {
  const socket = React.useContext(SocketContext);
  const [state, dispatch] = React.useContext(ApplicationContext);

  if (!state.status) {
    return null;
  }

  const createLayout = () => {
    socket.emit('createLayout');
  };

  const create404 = () => {
    socket.emit('create404');
  };

  const createConfig = () => {
    socket.emit('createConfig');
  };

  const pages = _.get(state.status, 'analyseInfo.projectAnalysePages.pages', []);
  const hasLayout = _.get(state.status, 'analyseInfo.projectAnalyseLayout.hasLayout', false);
  const hasNotFound = _.get(state.status, 'analyseInfo.projectAnalyseNotFound.hasNotFound', false);
  const hasConfig = _.get(state.status, 'analyseInfo.projectAnalyseConfig.hasConfig', false);

  if (state.status === null || state.status === undefined) {
    return null;
  }

  return (
    <List component="nav">
      <ListItem
        button
        onClick={() => {
          dispatch({
            type: 'setSelectedTreeKey',
            selectedTreeKey: 'routes',
          });
        }}
      >
        <ListItemText primary={`Pages(${pages.length})`} />
      </ListItem>
      <ListItem
        button
        onClick={() => {
          dispatch({
            type: 'setSelectedTreeKey',
            selectedTreeKey: 'layout',
          });
        }}
      >
        <ListItemText primary={'Layout'} />
        {!hasLayout && (
          <ListItemSecondaryAction>
            <Button onClick={createLayout}>Add</Button>
          </ListItemSecondaryAction>
        )}
      </ListItem>
      <ListItem
        button
        onClick={() => {
          dispatch({
            type: 'setSelectedTreeKey',
            selectedTreeKey: '404',
          });
        }}
      >
        <ListItemText primary={'404'} />
        {!hasNotFound && (
          <ListItemSecondaryAction>
            <Button onClick={create404}>Add</Button>
          </ListItemSecondaryAction>
        )}
      </ListItem>
      <ListItem
        button
        onClick={() => {
          dispatch({
            type: 'setSelectedTreeKey',
            selectedTreeKey: 'config',
          });
        }}
      >
        <ListItemText primary={'Config'} />
        {!hasConfig && (
          <ListItemSecondaryAction>
            <Button onClick={createConfig}>Add</Button>
          </ListItemSecondaryAction>
        )}
      </ListItem>
    </List>
  );
});
