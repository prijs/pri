import * as React from 'react';
import { State, Action } from '../define';

export const ApplicationContext = React.createContext<[State, React.Dispatch<Action>]>(null);

export const ApplicationReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'loadUiPlugins':
      if (action.plugins) {
        // Run plugins init function.
        action.plugins.forEach(plugin => {
          if (plugin.init) {
            plugin.init();
          }
        });

        return {
          ...state,
          plugins: action.plugins,
        };
      }
      return state;
    case 'setSelectedTreeKey':
      return {
        ...state,
        selectedTreeKey: action.selectedTreeKey,
      };
    case 'freshProjectStatus':
      return {
        ...state,
        status: action.status,
      };
    default:
      return state;
  }
};
